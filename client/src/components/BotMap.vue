<template>
  <div class="botMap">
    <section>
      <form @submit.prevent="newCleaningBot">
        <fieldset :disabled="!!theBot" style="width: 100px">
          <textarea id="map" name="map" style="width: 250px; height: 300px" />
          <div>
            <button>New Cleaning Bot</button>
          </div>
        </fieldset>
      </form>

      <Stats :map-data="mapData" />
    </section>

    <div v-if="!!endMessage" style="float: left; clear: both;">
      <p>{{ endMessage }}</p>
    </div>

    <!-- The width/height of the canvas should be determined by the width/height of the map -->
    <div
      v-if="surveillanceTab"
      class="surveillance"
      style="position: relative;"
    >
      <canvas
        style="position: absolute; left: 0; top: 0; z-index: 0;"
        id="mapCanvas"
        width="1000"
        height="1000"
        >Your browser does not support the HTML5 canvas tag.</canvas
      >
      <canvas
        style="position: absolute; left: 0; top: 0; z-index: 1;"
        id="heatMapCanvas"
        width="1000"
        height="1000"
        >Your browser does not support the HTML5 canvas tag.</canvas
      >
      <canvas
        style="position: absolute; left: 0; top: 0; z-index: 2;"
        id="botCanvas"
        width="1000"
        height="1000"
        >Your browser does not support the HTML5 canvas tag.</canvas
      >
    </div>
  </div>
</template>

<script>
const STARTING_COORD_X = 20;
const STARTING_COORD_Y = 20;
const UNIT_SIZE_X = 20;
const UNIT_SIZE_Y = 20;
const API_URL = "http://localhost:3000";

import io from "socket.io-client";
import axios from "axios";
import Vue from "vue";

import Stats from "./Stats.vue";

export default {
  name: "BotMap",
  components: {
    Stats
  },
  data: function() {
    return {
      theBot: null,
      surveillanceTab: null,
      socket: io(API_URL),
      mapData: null,
      endMessage: null
    };
  },

  mounted: function() {
    var me = this;
    this.socket.on("new_cleaner", function(data) {
      // console.log('a new bot has started cleaning ' + data.id);
      // @TODO: hold an array of maps to tab through the different bots that are currently cleaning
      me.theBot = data.id;
      me.surveillanceTab = `surveillance${data.id}`;

      Vue.nextTick(function() {
        me.drawMap(data.map);
        me.drawNeo(data.pos.x, data.pos.y);
        me.drawFilledInTile(data.pos.x, data.pos.y);
      });
    });

    this.socket.on("is_cleaning", function(data) {
      if (me.surveillanceTab && data.id == me.theBot) {
        // console.log('bot is cleaning', data);
        me.drawNeo(data.pos.x, data.pos.y);
        me.drawFilledInTile(data.pos.x, data.pos.y);

        me.mapData = {
          cleanedFloorMap: data.cleanedFloorMap,
          elapsedTime: data.elapsedTime,
          productivity: data.productivity
        };
      }
    });

    this.socket.on("end_cleaning", function(data) {
      if (me.surveillanceTab && data.id == me.theBot) {
        me.endMessage = data.message;
        me.mapData = {
          cleanedFloorMap: data.cleanedFloorMap,
          elapsedTime: data.elapsedTime,
          productivity: data.productivity
        };
      }
    });
  },

  methods: {
    /**
     * Draw the map from the map array
     */
    drawMap: function(map) {
      // clear heat map
      var cHeatMap = document.getElementById("heatMapCanvas");
      var ctxHeatMap = cHeatMap.getContext("2d");
      ctxHeatMap.clearRect(0, 0, cHeatMap.width, cHeatMap.height);

      // clear map
      var c = document.getElementById("mapCanvas");
      var ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);

      /**
       * When drawing the coordinatnes from the array, [y][x] are transposed
       * to (x, y) which is why I reverse the coordinatnes in the two
       * functions, drawWall(), and drawFloor()
       */

      for (var y = 0; y < map.length; y++) {
        for (var x = 0; x < map[y].length; x++) {
          if (map[y][x] === "#") {
            this.drawWall(ctx, x, y);
          } else {
            this.drawFloor(ctx, x, y);
          }
        }
      }
    },

    /**
     * Draw a wall on the canvas provided a coordinate (x,y)
     */
    drawWall: function(ctx, x, y) {
      ctx.beginPath();
      ctx.fillStyle = "black";
      ctx.strokeStyle = "gray";

      // x, y, width, height
      ctx.rect(
        x * UNIT_SIZE_X + STARTING_COORD_X, // x
        y * UNIT_SIZE_Y + STARTING_COORD_Y, // y
        UNIT_SIZE_X, // width
        UNIT_SIZE_Y // height
      );
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },

    /**
     * Draw a floor on the canvas provided a coordinate (x,y)
     */
    drawFloor: function(ctx, x, y) {
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.strokeStyle = "cyan";

      ctx.rect(
        x * UNIT_SIZE_X + STARTING_COORD_X, // x
        y * UNIT_SIZE_Y + STARTING_COORD_Y, // y
        UNIT_SIZE_X, // width
        UNIT_SIZE_Y // height
      );
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },

    /**
     * Draw the bot on the canvas provided a coordinate (x,y)
     */
    drawNeo: function(x, y) {
      var c = document.getElementById("botCanvas");
      var ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);

      ctx.beginPath();
      ctx.fillStyle = "green";
      ctx.strokeStyle = "gray";

      // x, y, width, height
      ctx.arc(
        x * UNIT_SIZE_X + STARTING_COORD_X + UNIT_SIZE_X / 2, // x
        y * UNIT_SIZE_Y + STARTING_COORD_Y + UNIT_SIZE_X / 2, // y
        UNIT_SIZE_X / 4, // radius
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },

    /**
     * Draw a filled in tile on the canvas provided a coordinate (x,y)
     */
    drawFilledInTile: function(x, y) {
      var c = document.getElementById("heatMapCanvas");
      var ctx = c.getContext("2d");

      ctx.beginPath();
      ctx.fillStyle = "rgba(245, 100, 100, 0.1)";
      ctx.strokeStyle = "darkred";

      ctx.rect(
        x * UNIT_SIZE_X + STARTING_COORD_X,
        y * UNIT_SIZE_Y + STARTING_COORD_Y,
        UNIT_SIZE_X,
        UNIT_SIZE_Y
      );
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },

    /**
     * Make a POST request to the backend server to start a new cleaning bot.
     */
    newCleaningBot: function(event) {
      var data = {
        socketId: this.socket.id,
        map: event.target.map.value
      };
      axios
        .post(API_URL + "/api/new", data)
        .then(function() {})
        .catch(function(err) {
          console.error(err);
        });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.stats {
  float: left;
}
form {
  float: left;
  width: 400px;
}

ul {
  list-style: none;
  text-align: left;
}

.surveillance {
  float: left;
  clear: both;
}
</style>
