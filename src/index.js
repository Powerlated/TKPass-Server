const restify = require("restify");

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("db.json");
const db = low(adapter);

const logger = require("winston");

logger.add(new logger.transports.Console());

db.defaults({ msgs: [], scores: {} }).write();

function respondScorePlayer(req, res, next) {
  let stats = db.get("scores").value();

  let reqName = req.params.name;

  let returnScore;
  let returnStatus = 200;

  let err;

  console.log("SCORE: Asked for score of a player: " + reqName);

  if (stats[reqName]) {
    console.log(`[200] Score for player ${reqName}: ${stats[reqName]}`);
    returnScore = stats[reqName];
  } else {
    err = `[404] Score for player ${reqName} not found.`;
    console.log(err);
    returnStatus = 404;
    returnScore = 0;
  }

  res.send(returnStatus, { score: returnScore, err: err });
  next();
}

function respondScores(req, res, next) {
  let stats = db.get("scores").value();
  console.log("SCORE: Asked for all scores");
  console.log(`[200] Scores: ${stats}`);
  res.send(200, stats);
  next();
}

function setScorePlayer(req, res, next) {
  let data = req.body;

  let name = req.params.name;

  if (parseInt(data) || !data) {
    db.get("scores")
      .set(name, data)
      .write();

    res.send(200);
  } else {
    res.send(422);
  }

  next();
}

var server = restify.createServer({ name: "TKPass-Server" });

// JSON Stuff
server.use(restify.plugins.jsonBodyParser({ mapParams: true }));
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser({ mapParams: true }));
server.use(restify.plugins.fullResponse());

server.pre(restify.pre.sanitizePath());
server.use(restify.plugins.queryParser());

// server.get("/hello/:name", respond);
// server.head("/hello/:name", respond);

server.get("/api/stats/:name", respondScorePlayer);
server.get("/api/stats", respondScores);

server.post("/api/stats/:name", setScorePlayer);

server.listen(8081, function() {
  console.log("%s listening at %s", server.name, server.url);
});
