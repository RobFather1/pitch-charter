import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
  };

  console.log("EVENT:", JSON.stringify(event));

  const method = event.httpMethod || event.requestContext?.http?.method || "POST";
  const path = event.path || event.rawPath || "";

  // ── ROSTER ROUTES ──────────────────────────────────────────
  if (path.includes("/roster")) {

    // GET /roster?teamID=main  →  load all pitchers for a team
    if (method === "GET") {
      const teamID = event.queryStringParameters?.teamID || "main";

      const response = await docClient.send(new QueryCommand({
        TableName: "Rosters",
        KeyConditionExpression: "teamID = :teamID",
        ExpressionAttributeValues: { ":teamID": teamID }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response.Items)
      };
    }

    // POST /roster  →  save a single pitcher
    if (method === "POST") {
      const body = event.body ? JSON.parse(event.body) : event;

      const item = {
        teamID: String(body.teamID || "main"),
        pitcherID: String(body.pitcherID),
        name: String(body.name || ""),
        number: String(body.number || "")
      };

      await docClient.send(new PutCommand({
        TableName: "Rosters",
        Item: item
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Pitcher saved!" })
      };
    }

    // DELETE /roster  →  remove a single pitcher
    if (method === "DELETE") {
      const body = event.body ? JSON.parse(event.body) : event;

      await docClient.send(new DeleteCommand({
        TableName: "Rosters",
        Key: {
          teamID: String(body.teamID || "main"),
          pitcherID: String(body.pitcherID)
        }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Pitcher deleted!" })
      };
    }
  }

  // ── BATTER ROUTES ──────────────────────────────────────────
  if (path.includes("/batters")) {

    // GET /batters?gameID=  →  load all batters for a game
    if (method === "GET") {
      const gameID = event.queryStringParameters?.gameID;

      if (!gameID) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing gameID" })
        };
      }

      const response = await docClient.send(new QueryCommand({
        TableName: "Batters",
        KeyConditionExpression: "gameID = :gameID",
        ExpressionAttributeValues: { ":gameID": gameID }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response.Items)
      };
    }

    // POST /batters  →  save a single batter
    if (method === "POST") {
      const body = event.body ? JSON.parse(event.body) : event;

      const item = {
        gameID: String(body.gameID),
        batterID: String(body.batterID),
        number: String(body.number || ""),
        name: String(body.name || ""),
        hand: String(body.hand || "")
      };

      await docClient.send(new PutCommand({
        TableName: "Batters",
        Item: item
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Batter saved!" })
      };
    }

    // DELETE /batters  →  remove a single batter
    if (method === "DELETE") {
      const body = event.body ? JSON.parse(event.body) : event;

      await docClient.send(new DeleteCommand({
        TableName: "Batters",
        Key: {
          gameID: String(body.gameID),
          batterID: String(body.batterID)
        }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Batter deleted!" })
      };
    }
  }

  // ── PITCH ROUTES ────────────────────────────────────────────
  const isGet = method === "GET" || event.queryStringParameters?.gameId;
  const isPost = method === "POST" || event.gameId || (event.body && JSON.parse(event.body).gameId);

  try {
    if (isPost && !isGet) {
      const pitch = event.body ? JSON.parse(event.body) : event;

      if (!pitch.gameId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing gameId" })
        };
      }

      const item = {
        gameID: String(pitch.gameId),
        pitchNumber: parseInt(pitch.pitchNumber, 10),
        gameDate: String(pitch.gameDate || ""),
        gameNumber: String(pitch.gameNumber || ""),
        inning: String(pitch.inning || ""),
        pitcherName: String(pitch.pitcherName || ""),
        pitcherNumber: String(pitch.pitcherNumber || ""),
        batterNumber: String(pitch.batterNumber || ""),
        batterName: String(pitch.batterName || ""),
        batterHand: String(pitch.batterHand || ""),
        pitchType: String(pitch.pitchType || ""),
        velocity: String(pitch.velocity || ""),
        zone: String(pitch.zone || ""),
        result: String(pitch.result || ""),
        outcome: String(pitch.outcome || ""),
        opponent: String(pitch.opponent || ""),
        ballCount: String(pitch.ballCount ?? ""),
        strikeCount: String(pitch.strikeCount ?? "")
      };

      await docClient.send(new PutCommand({
        TableName: "Pitches",
        Item: item
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Pitch saved!" })
      };
    }

    if (isGet) {
      const gameId = event.queryStringParameters?.gameId;

      const response = await docClient.send(new QueryCommand({
        TableName: "Pitches",
        KeyConditionExpression: "gameID = :gameID",
        ExpressionAttributeValues: { ":gameID": String(gameId) }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response.Items)
      };
    }

  } catch (error) {
    console.log("ERROR:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};