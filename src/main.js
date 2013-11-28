$(function() {

    function makeComputerPlayers(numPlayers) {
        var computerNames = ['Alice', 'Bob', 'Carlos'];
        return _.take(computerNames, numPlayers).map(function(name) {
            var AI = new ComputerAI(null);
            var player = new Player(name, AI);
            AI.player = player;
            return player;
        });
    }

    var numPlayers = 2;
    var $canvas = $('#canvas');
    var $log = $('#log');
    var kingdomCards = _.sample(Cards.BaseSet, NumKingdomCards);

    var playerInterface = new PlayerInterface(null);
    var humanPlayer = new Player('Player', playerInterface);
    playerInterface.player = humanPlayer;
    var players = [humanPlayer].concat(makeComputerPlayers(numPlayers - 1));

    var game = new Game(kingdomCards, players);
    var gameView = new GameView(game, 0);

    playerInterface.setGameView(gameView);
    game.start();

    window.dominion = {
        g: game,
        gv: gameView
    };
});