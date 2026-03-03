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

    // GET /roster?teamId=main  →  load all pitchers for a team
    if (method === "GET") {
      const teamId = event.queryStringParameters?.teamId || "main";

      const response = await docClient.send(new QueryCommand({
        TableName: "Rosters",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: { ":teamId": teamId }
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
        teamId: String(body.teamId || "main"),
        pitcherId: String(body.pitcherId),
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
          teamId: String(body.teamId || "main"),
          pitcherId: String(body.pitcherId)
        }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Pitcher deleted!" })
      };
    }
  }

  // ── PITCH ROUTES (unchanged) ────────────────────────────────
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