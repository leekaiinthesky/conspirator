/**
 * @constructor
 */
function PlayerInterface(player) {
    this.player = player;
};

// This method solves a circular dependency between this,
// the game, and the gameView. Not ideal...
PlayerInterface.prototype.setGameView = function(gameView) {
    this.gameView = gameView;
};

PlayerInterface.prototype.promptForAction = function(game, playableActions) {
    this.gameView.showStatusMessage('Play an action');

    this.gameView.offerOptionalSingleHandSelection(this.player, playableActions, function(action) {
        if (action) {
            game.playAction(action);
        } else {
            game.skipActions();
        }
    });
};

PlayerInterface.prototype.promptForHandSelection = function(game, cards, label, onSelect) {
    this.gameView.showStatusMessage(label);
    this.gameView.offerSingleHandSelection(this.player, cards, onSelect);
};

PlayerInterface.prototype.promptForBuy = function(game, buyablePiles) {
    this.gameView.showStatusMessage('Buy a card');

    this.gameView.offerPileSelection(buyablePiles, true, _.bind(function(pile) {
        if (pile) {
            _.each(this.player.getTreasuresInHand(), function(card) {
                game.playTreasure(card);
            });
            game.buyFromPile(pile);
        } else {
            game.skipBuys();
        }
    }, this));
};

PlayerInterface.prototype.promptForGain = function(game, gainablePiles, onGain) {
    this.gameView.showStatusMessage('Gain a card');
    this.gameView.offerPileSelection(gainablePiles, true, onGain);
};

PlayerInterface.prototype.promptForDiscard = function(game, min, max, onDiscard) {
    if (min == max) {
        this.gameView.showStatusMessage('Discard ' + min + ' ' + pluralize('card', min));
    } else if (min == 0) {
        this.gameView.showStatusMessage('Discard up to ' + max + ' ' + pluralize('card', max));
    } else {
        this.gameView.showStatusMessage('Discard ' + min + ' to ' + max + ' cards');
    }
    
    this.gameView.offerMultipleHandSelection(this.player, min, max, onDiscard);
};

PlayerInterface.prototype.promptForTrashing = function(game, min, max, cards, onTrash) {
    if (min == max) {
        this.gameView.showStatusMessage('Trash ' + min + ' ' + pluralize('card', min));
    } else if (min == 0) {
        this.gameView.showStatusMessage('Trash up to ' + max + ' ' + pluralize('card', max));
    } else {
        this.gameView.showStatusMessage('Trash ' + min + ' to ' + max + ' cards');
    }

    this.gameView.offerMultipleHandSelection(this.player, min, max, cards, onTrash);
}

PlayerInterface.prototype.promptForReaction = function(game, reactions, onReact) {
    this.gameView.offerOptionalSingleHandSelection(this.player, reactions, onReact);
};

PlayerInterface.prototype.promptForChoice = function(game, decision, onDecide) {
    var $modal = $('.choice');
    var $footer = $modal.find('.modal-footer');

    $modal.find('.modal-title').text(decision.title);
    $footer.empty();

    _.each(decision.options, function(option) {
        var $button = $('<button>').addClass('btn btn-primary').text(option.toString()).click(function() {
            $modal.modal('hide');
            onDecide(option);
        });
        $button.appendTo($footer);
    });

    $modal.modal('show');
};