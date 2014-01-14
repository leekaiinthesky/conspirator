var _ = require('underscore');
var util = require('./util.js');
var Game = require('./game.js').Game;
var Card = require('./cards.js').Card;
var Decisions = require('./decisions.js');

Game.prototype.swindlerAttack = function(attackingPlayer, targetPlayers) {
    var that = this;
    _.each(_.reverse(targetPlayers), function(targetPlayer) {
        var attack = function() {
            var card = that.trashCardFromDeck(targetPlayer);
            if (card) {
                var cost = that.computeEffectiveCardCost(card);
                var gainableCards = _.pluck(that.filterGainablePiles(cost, cost, Card.Type.All), 'card');
                if (gainableCards.length > 0) {
                    var decision = Decisions.chooseCardToGain(attackingPlayer, targetPlayer, gainableCards);
                    attackingPlayer.promptForDecision(that, decision, function(gainedCard) {
                        that.playerGainsCard(targetPlayer, gainedCard);
                        that.advanceGameState();
                    });
                } else {
                    that.advanceGameState();
                }
            } else {
                that.advanceGameState();
            }
        };

        that.allowReactionsToAttack(targetPlayer, attack);
    });
};

Game.prototype.ironworksEffect = function(player) {
    var that = this;
    var gainableCards = _.pluck(that.filterGainablePiles(0, 4, Card.Type.All), 'card');
    var decision = Decisions.chooseCardToGain(player, player, gainableCards);

    player.promptForDecision(that, decision, function(gainedCard) {
        that.playerGainsCard(player, gainedCard);

        var modified = false;
        if (gainedCard.isAction()) {
            that.incrementActionCount();
            modified = true;
        }

        if (gainedCard.isTreasure()) {
            that.incrementCoinCount();
            modified = true;
        }

        if (gainedCard.isVictory()) {
            that.drawCards(player, 1);
        }

        if (modified) {
            that.stateUpdated();
        }

        that.advanceGameState();
    });
};
