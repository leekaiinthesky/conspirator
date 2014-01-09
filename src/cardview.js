var View = require('./util.js').View;
var Card = require('./cards.js').Card;
var Cards = require('./cards.js').Cards;

/**
 * @constructor
 */
function CardView(card, useCardback) {
    if (!card instanceof Card) {
        throw new Error('invalid object' + card);
    }

    this.card = card;
    this.$el = $('<div>').addClass('card');
    $('<img>').appendTo(this.$el);

    this.$badge = $('<div>').addClass('badge badge-warning').hide();
    this.$el.append(this.$badge);

    if (card) {
        this.setCardImage(useCardback ? Cards.Cardback : card);
    }

    this.$el.data('view', this);
}

module.exports.CardView = CardView;

CardView.prototype = Object.create(View.prototype);

CardView.prototype.setCardImage = function(card) {
    var $img = this.$el.find('img');
    $img.attr('src', card ? card.assetURL : '');
};

CardView.prototype.setBadgeCount = function(count) {
    if (count === 0) {
        this.$badge.hide();
    } else {
        this.$badge.show().text(count);
    }
};

/**
 * @constructor
 */
function PileView(pile) {
    this.pile = pile;

    this.$el = $('<div>').addClass('card');
    var $img = $('<img>').appendTo(this.$el);
    $img.attr('src', this.pile.card.assetURL);

    this.$badge = $('<div>').text(this.pile.count).addClass('badge badge-warning');
    this.$el.append(this.$badge);
    this.updateCount();

    this.$el.data('view', this);
}

PileView.prototype = Object.create(View.prototype);

PileView.prototype.updateCount = function() {
    if (this.$badge) {
        this.$badge.text(this.pile.count);
    }
};

module.exports.PileView = PileView;