const util = require("../lib/util");
const MAX_NUM_REPEATED_TILES = 25;
const SLEEP_TIME = 200;

class NeoBot {
  constructor(broadcaster, mapString) {
    this.id = util.generateIdentifier();
    this.broadcaster = broadcaster;
    this.map = parseMapString(mapString);
    this.positionVec = getFirstOpenPosition(this.map);
    this.directionVec = { x: 1, y: 0 };
    this.emptyTiles = getEmptyFloors(this.map);
    this.emptyTiles[this.getKeyFromPositionVec()].cleaned++;

    broadcaster.emit("new_cleaner", {
      id: this.id,
      map: this.map,
      pos: this.positionVec
    });
  }

  getId() {
    return this.id;
  }

  /**
   * Convert the position vector into a key in the form x_y
   */
  getKeyFromPositionVec() {
    return _getKeyFromPositionVec(this.positionVec);
  }

  /**
   * From a mapString, set the map to the new mapString
   */
  setMap(mapString) {
    this.map = parseMapString(mapString);
  }

  setPositionVec(positionVec) {
    this.positionVec.x = positionVec.x;
    this.positionVec.y = positionVec.y;
  }

  move(directionVec) {
    this.positionVec.x += directionVec.x;
    this.positionVec.y += directionVec.y;
  }

  /**
   * The main function that starts the simulation
   */
  simulateCleaning() {
    cleanIt.call(this);
  }

  /**
   * Check if a tile exists provided a position vector (prevent out of bounds exception)
   */
  tileExists(positionVec) {
    return (
      typeof this.map[positionVec.y] !== "undefined" &&
      this.map[positionVec.y][positionVec.x] !== "undefined"
    );
  }

  /**
   * Get an array of directions that aren't walls. Also, exclude the
   * provided direction.
   */
  getNonWallDirections(excludingDirection) {
    let directions = getDirections();

    const me = this;
    let nonWallDirections = directions.filter(direction => {
      let nextPositionVec = {
        x: me.positionVec.x + direction.x,
        y: me.positionVec.y + direction.y
      };
      return (
        me.tileExists(nextPositionVec) &&
        me.map[nextPositionVec.y][nextPositionVec.x] !== "#"
      );
    });

    // Remove the direction that we're currently moving. (so we don't choose it again)
    if (typeof excludingDirection !== "undefined") {
      nonWallDirections = nonWallDirections.filter(direction => {
        return !(
          direction.x === excludingDirection.x &&
          direction.y === excludingDirection.y
        );
      });
    }

    return nonWallDirections;
  }

  /**
   * Get an array of directions that will lead to non cleaned tiles.
   */
  getNonCleanedDirections(excludingDirection = null) {
    let directions = getDirections();

    const me = this;
    let nonCleanedDirections = directions.filter(direction => {
      let nextPositionVec = {
        x: me.positionVec.x + direction.x,
        y: me.positionVec.y + direction.y
      };
      return (
        me.tileExists(nextPositionVec) &&
        me.map[nextPositionVec.y][nextPositionVec.x] === " " &&
        me.emptyTiles[_getKeyFromPositionVec(nextPositionVec)].cleaned <= 0
      );
    });

    // Remove the direction that we're currently moving. (so we don't choose it again)
    if (excludingDirection !== null) {
      nonCleanedDirections = nonCleanedDirections.filter(direction => {
        return !(
          direction.x === excludingDirection.x &&
          direction.y === excludingDirection.y
        );
      });
    }

    return nonCleanedDirections;
  }

  getLeastCleanedDirection() {
    let directions = getDirections();

    const me = this;

    let leastCleanedTotal = null;
    let leastCleanedDirection = null;
    for (let direction of directions) {
      let nextPositionVec = {
        x: me.positionVec.x + direction.x,
        y: me.positionVec.y + direction.y
      };

      if (
        me.tileExists(nextPositionVec) &&
        me.map[nextPositionVec.y][nextPositionVec.x] === " "
      ) {
        let key = _getKeyFromPositionVec(nextPositionVec);

        if (
          leastCleanedTotal === null ||
          me.emptyTiles[key].cleaned <= leastCleanedTotal
        ) {
          leastCleanedTotal = me.emptyTiles[key].cleaned;
          leastCleanedDirection = direction;
        }
      }
    }

    // if our current direction brings us to a tile that is equal to the least cleaned tile
    // then just keep going in our current direction.
    // @TODO: if more than one tile have equal "least" cleaned numbers, maybe select a
    // random one from them instead of always selecting the last one.
    let nextPositionVec = {
      x: me.positionVec.x + me.directionVec.x,
      y: me.positionVec.y + me.directionVec.y
    };
    if (
      me.tileExists(nextPositionVec) &&
      me.map[nextPositionVec.y][nextPositionVec.x] === " "
    ) {
      let key = _getKeyFromPositionVec(nextPositionVec);

      if (me.emptyTiles[key].cleaned <= leastCleanedTotal) {
        leastCleanedTotal = me.emptyTiles[key].cleaned;
        leastCleanedDirection = me.directionVec;
      }
    }

    return leastCleanedDirection;
  }
}

/**
 * From a mapString, parse each character and convert to array[][]
 */
function parseMapString(mapString) {
  // @TODO: some validation to ensure that the room is surrounded by walls (#)
  // @TODO: some validation to ensure that the room is an even rectangle
  let map = [];
  let levels = mapString.split("\n");
  for (level of levels) {
    let tiles = level.split("");
    map.push(tiles);
  }

  return map;
}

/**
 * Retrieve the first empty tile on the map
 */
function getFirstOpenPosition(map) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === " ") {
        return {
          x: x,
          y: y
        };
      }
    }
  }
  return {
    x: 0,
    y: 0
  }
}

/**
 * Retrieve all the cleanable (empty tiles) and return them as an object.
 */
function getEmptyFloors(map) {
  let emptyFloors = {};
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === " ") {
        let key = _getKeyFromPositionVec({ x: x, y: y });
        emptyFloors[key] = { cleaned: 0 };
      }
    }
  }

  return emptyFloors;
}

/**
 * Convert the position vector into a key in the form x_y
 */
function _getKeyFromPositionVec(positionVec) {
  return positionVec.x + "_" + positionVec.y;
}

/**
 * All the available directions that can be set
 */
function getDirections() {
  return [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
}

/**
 * Get a random direction from the list of directions and exclude
 * the direction provided in the argument
 */
function getRandomDirection(excludingDirection) {
  let directions = getDirections();

  // Remove the direction that we're currently moving. (so we don't choose it again)
  directions = directions.filter(direction => {
    return !(
      direction.x === excludingDirection.x &&
      direction.y === excludingDirection.y
    );
  });

  return directions[Math.floor(Math.random() * directions.length)];
}

/**
 * From a provided array of directions, pick a random direction.
 */
function getRandomDirectionFromSet(directionSet) {
  if (directionSet.length <= 0) {
    return [];
  }
  return directionSet[Math.floor(Math.random() * directionSet.length)];
}

function getLeastCleanedTile(currentDirection) {
  let directions = getDirections();

  // Remove the direction that we're currently moving. (so we don't choose it again)
  directions = directions.filter(direction => {
    return !(
      direction.x === excludingDirection.x &&
      direction.y === excludingDirection.y
    );
  });

  return directions[Math.floor(Math.random() * directions.length)];
}

/**
 * The main loop to make the robot move.
 */
function cleanIt() {
  const me = this;
  let elapsedTime = 0;

  let prevNumNewCleanedTiles = 0;
  let numNewCleanedTiles = 0; // new cleaned tiles per second
  let millisecondsCounter = 0;

  let startTime = new Date().getTime();

  let theInterval = setInterval(() => {
    /**
     * Keep track of time progression
     */
    let endTime = new Date().getTime();
    elapsedTime += endTime - startTime;
    millisecondsCounter += endTime - startTime;
    startTime = endTime;

    // create the next position vector based on current position and current direction
    let nextPositionVec = {
      x: me.positionVec.x + me.directionVec.x,
      y: me.positionVec.y + me.directionVec.y
    };

    // if next position is a space AND NOT already cleaned then proceed to that tile
    if (
      me.tileExists(nextPositionVec) &&
      me.map[nextPositionVec.y][nextPositionVec.x] === " " &&
      me.emptyTiles[_getKeyFromPositionVec(nextPositionVec)].cleaned === 0
    ) {
      // increment the number of new cleaned tiles
      prevNumNewCleanedTiles++;

      // update the position
      me.setPositionVec(nextPositionVec);
    } else {
      // keep a list of all the tiles that aren't walls
      let absoluteAllowedDirections = me.getNonWallDirections();

      let nonCleanedDirections = me.getNonCleanedDirections();
      if (nonCleanedDirections.length > 0) {
        me.directionVec = getRandomDirectionFromSet(nonCleanedDirections);
      } else {
        // if all surrounding tiles are already cleaned, pick a tile that's
        // the least cleaned. And if the current direction's next tile is tied as the least cleaned
        // use the current direction.. (this is only so that the robot
        // doesn't look crazy)
        // @TODO: some kind of check needs to be put in place to prevent the bot
        // from going around and around and around in circles (maybe keep
        // track of lastDirection)
        me.directionVec = me.getLeastCleanedDirection();
        // me.directionVec = getRandomDirectionFromSet(absoluteAllowedDirections);
      }

      // move in that direction
      me.move(me.directionVec);
    }

    if (millisecondsCounter >= 1000) {
      numNewCleanedTiles = prevNumNewCleanedTiles;
      prevNumNewCleanedTiles = 0;
      millisecondsCounter = 0;
    }

    // emit event and stuff
    let timesCleaned = 0;
    let key = me.getKeyFromPositionVec();
    if (me.emptyTiles.hasOwnProperty(key)) {
      me.emptyTiles[key].cleaned++;
      timesCleaned = me.emptyTiles[key].cleaned;
    }

    me.broadcaster.emit("is_cleaning", {
      id: me.id,
      message:
        "is cleaning [" +
        me.positionVec.x +
        "," +
        me.positionVec.y +
        "]: " +
        me.map[me.positionVec.y][me.positionVec.x],
      pos: me.positionVec,
      timesCleaned: timesCleaned,
      cleanedFloorMap: me.emptyTiles,
      elapsedTime: elapsedTime,
      productivity: numNewCleanedTiles
    });

    // SOme stats stuff to keep track of how many were cleaned and how many total
    let numCleaned = 0;
    let totalTiles = 0;
    for (emptyTileKey in me.emptyTiles) {
      totalTiles++;
      if (me.emptyTiles[emptyTileKey].cleaned > 0) {
        numCleaned++;
      }
    }

    // if the tile isn't cleaned too many times AND there are still more tiles to clean, keep cleaning
    if (
      me.emptyTiles[key].cleaned > MAX_NUM_REPEATED_TILES ||
      numCleaned >= totalTiles
    ) {
      let message = "";
      if (me.emptyTiles[key].cleaned > MAX_NUM_REPEATED_TILES) {
        message =
          "My AI pathfinding isn't great, if you can tell. I cleaned this same floor like " +
          me.emptyTiles[key].cleaned +
          " flipping times already. So before I bore you to death, let me just end it right here...";
      } else {
        message = "The room is 100% complete! Now you can relax :D";
      }
      me.broadcaster.emit("end_cleaning", {
        id: me.id,
        message: message,
        cleanedFloorMap: me.emptyTiles,
        elapsedTime: elapsedTime,
        productivity: numNewCleanedTiles
      });
      clearInterval(theInterval);
    }
  }, SLEEP_TIME);
}

module.exports = NeoBot;
