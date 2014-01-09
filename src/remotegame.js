// RemoteGame acts as a local proxy for a server-hosted game.

var _ = require('underscore');
var events = require('events');
var util = require('./util.js');
var Cards = require('./cards.js').Cards;
var serialization = require('./serialization.js');

function deserializeArguments(args, playerLookupFunc) {
    return Array.prototype.slice.apply(args).map(function(o) {
        return serialization.deserialize(o, playerLookupFunc);
    });
}

function serializeArguments(args) {
    return serialization.serialize(
        Array.prototype.slice.apply(args));
}

function RemoteGame(socket, gameState, humanInterface) {
    var that = this;
    this.socket = socket;
    this.gameState = gameState;
    this.humanInterface = humanInterface;

    this.players = _.map(gameState.players, function(playerState) {
        return new RemotePlayer(playerState);
    });
    this.kingdomPileGroups = serialization.deserialize(gameState.kingdomPileGroups);

    if (gameState.playerIndex >= 0) {
        this.humanInterface.player = this.players[gameState.playerIndex];
    }

    var that = this;
    var playerLookupFunc = _.bind(this.lookupAndUpdatePlayer, this);

    var forwardedEvents = [
        'state-update', 'draw-cards', 'empty-play-area', 'trash-card-from-play',
        'trash-cards-from-hand', 'add-card-to-trash', 'game-over', 'play-card',
        'gain-card', 'gain-card-into-hand', 'discard-cards', 'draw-and-discard-cards',
        'discard-cards-from-deck'];

    _.each(forwardedEvents, function(eventName) {
        socket.on(eventName, function() {
            var eventArgs = deserializeArguments(arguments, playerLookupFunc);
            var emitArgs = [eventName].concat(eventArgs);
            that.emit.apply(that, emitArgs);
        });
    }, this);

    this.listenForPrompt('action-prompt', 'promptForAction');
    this.listenForPrompt('buy-prompt', 'promptForBuy');
    this.listenForPrompt('gain-prompt', 'promptForGain');
    this.listenForPrompt('discard-prompt', 'promptForDiscard');
    this.listenForPrompt('trash-prompt', 'promptForTrashing');
    this.listenForPrompt('reaction-prompt', 'promptForReaction');
    this.listenForPrompt('decision-prompt', 'promptForDecision');
}

RemoteGame.prototype = Object.create(events.EventEmitter.prototype);

RemoteGame.prototype.emitDecision = function(decisionArgs) {
    var eventArgs = ['decision'].concat(serializeArguments(decisionArgs));
    this.socket.emit.apply(this.socket, eventArgs)
};

RemoteGame.prototype.listenForPrompt = function(prompt, deciderProperty) {
    var that = this;
    this.socket.on(prompt, function() {
        var callback = function() {
            that.emitDecision(arguments);
        };

        var args = [that].concat(
            deserializeArguments(arguments),
            [callback]);

        var func = that.humanInterface[deciderProperty];
        func.apply(that.humanInterface, args);
    })
};

RemoteGame.prototype.lookupAndUpdatePlayer = function(o) {
    var player = _.find(this.players, function(p) {
        return p.id === o.id;
    });

    if (player) {
        player.updateLocalState(o);
        return player;
    } else {
        console.error('unable to find player')
        return null;
    }

    return player;
};

// RemotePlayer represents what this client knows about this player.
// Since RemoteGame will never ask its players for decisions, no decision
// logic is needed.
function RemotePlayer(playerState) {
    this.id = playerState.id;
    this.name = playerState.name;
    this.updateLocalState(playerState);
};

RemotePlayer.prototype.updateLocalState = function(playerState) {
    this.state = playerState;
    this.state.topDiscard = playerState.topDiscard
        ? serialization.deserialize(playerState.topDiscard)
        : null;
    this.hand = serialization.deserialize(playerState.hand);
};

RemotePlayer.prototype.deckCount = function() {
    return this.state.deckCount;
};

RemotePlayer.prototype.topDiscard = function() {
    return this.state.topDiscard;
};


module.exports = RemoteGame;
