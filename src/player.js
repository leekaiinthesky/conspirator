function startingDeck() {
    return _.flatten(
        [repeat(Cards.Copper, 7), repeat(Cards.Estate, 3)],
        true);
}

/**
 * @constructor
 */
function Player(name, decider) {
    this.name = name;
    this.decider = decider;
    this.hand = [];

    // Card stacks store their bottom-most card at index 0.
    this.deck = _.shuffle(startingDeck());
    this.discard = [];
}

Player.prototype = new EventEmitter();

Player.PlayerUpdates = {
    DiscardCards: 'discard-cards',
    DiscardCardsFromDeck: 'discard-cards-from-deck',
    PlayCard: 'play-card',
    DrawCards: 'draw-cards',
    TrashCards: 'trash-cards',
    Shuffle: 'shuffle'
};

Player.prototype.canDraw = function() {
    return this.deck.length > 0 || this.discard.length > 0;
};

Player.prototype.addCardsToHand = function(cards) {
    this.hand = this.hand.concat(cards);
    this.emit(Player.PlayerUpdates.DrawCards, cards);
};

Player.prototype.addCardToHand = function(card) {
    this.addCardsToHand([card]);
};

Player.prototype.shuffleCompletely = function() {
    this.deck = _.shuffle(this.deck.concat(this.discard));
    this.discard = [];
    this.emit(Player.PlayerUpdates.Shuffle);
};

Player.prototype.shuffleKeepingDeckOnTop = function() {
    this.deck = _.shuffle(this.discard).concat(this.deck);
    this.discard = [];
    this.emit(Player.PlayerUpdates.Shuffle);
};

Player.prototype.takeCardFromDeck = function(num) {
    return _.head(this.takeCardsFromDeck(1));
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

Player.prototype.revealCardsFromDeck = function(n) {
    if (this.deck.length < n) {
        this.shuffleKeepingDeckOnTop();
    }

    return _.last(this.deck, n);
};

Player.prototype.getMatchingCardsInHand = function(cardOrType) {
    return _.filter(this.hand, function(c) {
        return c.matchesCardOrType(cardOrType);
    });
};

Player.prototype.getTreasuresInHand = function() {
    return this.getMatchingCardsInHand(Card.Type.Treasure);
};

Player.prototype.getActionsInHand = function() {
    return this.getMatchingCardsInHand(Card.Type.Action);
};

Player.prototype.getFullDeck = function() {
    return this.hand.concat(this.deck, this.discard);
};

Player.prototype.getMatchingCardsInFullDeck = function(cardOrType) {
    return this.getFullDeck().filter(function(c) {
        return c.matchesCardOrType(cardOrType);
    });
};

Player.prototype.calculateScore = function() {
    var score = _.mapSum(this.getFullDeck(), _.bind(function(card) {
        if (_.has(card, 'vp')) {
            return _.isFunction(card.vp) ? card.vp(this) : card.vp;
        } else {
            return 0;
        }
    }, this));
    return score;
};