var _ = require('underscore');
var Cards = require('./cards.js').Cards;
var Card = require('./cards.js').Card;
var Pile = require('./cards.js').Pile;
var BasePlayer = require('./baseplayer.js');
var util = require('./util.js');

function startingDeck() {
    return _.flatten(
        [util.repeat(Cards.Copper, 7), util.repeat(Cards.Estate, 3)],
        true);
}

/**
 * @constructor
 */
function Player(name, decider, id) {
    this.name = name;
    this.id = id; // Only needed for client-server communication. Null for local games.
    this.decider = decider;
    this.decider.setPlayer(this);
    this.gameEmitter = null;

    this.hand = [];

    // Card stacks store their bottom-most card at index 0.
    this.deck = _.shuffle(startingDeck());
    this.discard = [];
}

Player.prototype = Object.create(BasePlayer.prototype);

Player.prototype.setGameEmitter = function(gameEmitter) {
    this.gameEmitter = gameEmitter;
};

Player.prototype.canDraw = function() {
    return this.deck.length > 0 || this.discard.length > 0;
};

Player.prototype.addCardsToHand = function(cards) {
    this.hand = this.hand.concat(cards);
};

Player.prototype.addCardToHand = function(card) {
    this.addCardsToHand([card]);
};

Player.prototype.addCardsToDiscard = function(cards) {
    this.discard = this.discard.concat(cards);
};

Player.prototype.addCardToDiscard = function(card) {
    this.addCardsToDiscard([card]);
};

Player.prototype.takeCardsFromDeck = function(num) {
    var cards = [];
    while (cards.length < num && this.canDraw()) {

        if (this.deck.length == 0) {
            this.shuffleCompletely();
        }

        cards.push(this.deck.pop());
    }

    return cards;
};

Player.prototype.takeCardFromDeck = function() {
    return _.head(this.takeCardsFromDeck(1));
};

Player.prototype.discardCardsFromDeck = function(num) {
    var cards = this.takeCardsFromDeck(num);
    this.discard = this.discard.concat(cards);
    return cards;
};

Player.prototype.discardCardFromDeck = function() {
    return _.head(this.discardCardsFromDeck(1));
};

Player.prototype.revealCardsFromDeck = function(n) {
    if (this.deck.length < n) {
        this.shuffleKeepingDeckOnTop();
    }

    return _.last(this.deck, n);
};

Player.prototype.revealCardFromDeck = function() {
    return _.head(this.revealCardsFromDeck(1));
};

Player.prototype.shuffleKeepingDeckOnTop = function() {
    this.deck = _.shuffle(this.discard).concat(this.deck);
    this.discard = [];
    this.gameEmitter.emit('shuffle', this);
};

Player.prototype.shuffleCompletely = function() {
    this.deck = _.shuffle(this.deck.concat(this.discard));
    this.discard = [];
    this.gameEmitter.emit('shuffle', this);
};

// Abstract methods

Player.prototype.getHand = function() {
    return this.hand;
};

Player.prototype.getFullDeck = function() {
    return this.hand.concat(this.deck, this.discard);
};

Player.prototype.deckCount = function() {
    return this.deck.length;
};

Player.prototype.topDiscard = function() {
    return this.discard.length > 0 ? _.last(this.discard) : null;
};

// Prompts

Player.prototype.promptForAction = function(game, playableActions) {
    this.decider.promptForAction(game, playableActions, function(action) {
        if (action) {
            if (!action instanceof Card) {
                console.error('Invalid action to play', action);
                return;
            }
            game.playAction(action);
        } else {
            game.skipActions();
        }
    });
};

Player.prototype.promptForBuy = function(game, buyablePiles, allowTreasures) {
    this.decider.promptForBuy(game, buyablePiles, allowTreasures, function(treasures, cardToBuy) {
        if (cardToBuy && cardToBuy instanceof Card === false) {
            throw new Error('Invalid card to buy: ' + cardToBuy);
        }

        _.each(treasures, function(treasure) {
            if (treasure instanceof Card === false) {
                throw new Error('Invalid treasure to play: ' + JSON.stringify(treasure));
            }
            game.playTreasure(treasure);
        });

        if (cardToBuy) {
            game.buyCard(cardToBuy);
        } else if (treasures.length === 0) {
            game.skipBuys();
        } else {
            game.advanceGameState();
        }
    });
};

Player.prototype.promptForGain = function(game, gainablePiles, onGain) {
    this.decider.promptForGain(game, gainablePiles, onGain);
};

Player.prototype.promptForDiscard = function(game, min, max, cards, onDiscard) {
    var that = this;
    this.decider.promptForDiscard(game, min, max, cards, function(cards) {
        if (cards.length > 0) {
            game.discardCards(that, cards);
        }
        if (onDiscard) {
            onDiscard(cards);
        }
    });
};

Player.prototype.promptForTrashing = function(game, min, max, cards, onTrash) {
    var that = this;
    this.decider.promptForTrashing(game, min, max, cards, function(cards) {
        if (cards.length > 0) {
            game.trashCards(that, cards);
        }
        if (onTrash) {
            onTrash(cards);
        }
    });
};

Player.prototype.promptForReaction = function(game, reactions, onReact) {
    this.decider.promptForReaction(game, reactions, onReact);
};

function optionToKey(o) {
    if (o instanceof Card) {
        return o.name;
    } else if (o._optionString) {
        return o._optionString;
    } else if (_.isString(o)) {
        return o;
    } else {
        console.error('Unable to convert option to key', o);
        return null;
    }
};

Player.prototype.promptForDecision = function(game, decision, onDecide) {
    var optionMap = _.object(_.map(decision.options, function(o) {
        return [optionToKey(o), o];
    }));

    var clonedDecision = _.clone(decision);
    clonedDecision.options = Object.keys(optionMap);

    this.decider.promptForDecision(game, clonedDecision, function(decision) {
        if (decision in optionMap) {
            onDecide(optionMap[decision]);
        } else {
            console.error('Unexpected decision', decision, optionMap);
        }
    });
};

module.exports = Player;
