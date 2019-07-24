<template>
  <div class="stats">
    <table>
      <tr>
        <th>Stat</th>
        <th>Value</th>
      </tr>
      <tr :key="stat.title" v-for="stat in stats">
        <td>{{ stat.title }}</td>
        <td>{{ stat.val }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import _ from "lodash";

export default {
  name: "Stats",
  props: ["mapData"],
  data: function() {
    return {
      spats: [],
      stats: {
        cleanedTiles: { title: "Cleaned Tiles", val: 0 },
        percentCleaned: { title: "Percent Cleaned", val: "0 %" },
        numberOfRepeatedTiles: { title: "Number of Repeated Tiles", val: 0 },
        numberOfMoves: { title: "Number of Moves", val: 0 },
        mostRepeatedTile: { title: "Most Repeated Tile", val: 0 },
        productivity: { title: "Productivity", val: 0 },
        totalRepeatedTiles: {
          title: "Total Number of Times Tiles Repeated",
          val: 0
        },
        time: { title: "Time", val: "0 seconds" }
      }
    };
  },
  watch: {
    mapData: function(newMapData) {
      let total = 0;
      let cleaned = 0;
      let numMoves = 0;
      let repeatedTiles = 0;
      let totalRepeated = 0;

      let mostRepeated = 0;

      _.each(newMapData.cleanedFloorMap, function(tile) {
        total++;
        numMoves += tile.cleaned;

        if (tile.cleaned > mostRepeated) {
          mostRepeated = tile.cleaned;
        }

        if (tile.cleaned > 0) {
          cleaned++;
        }

        if (tile.cleaned > 1) {
          repeatedTiles++;
          totalRepeated += tile.cleaned - 1; // - 1 because we don't count the first one as repeated
        }
      });

      this.stats.cleanedTiles.val = cleaned;
      this.stats.percentCleaned.val =
        ((cleaned / total) * 100).toFixed(2) + " %";
      this.stats.numberOfMoves.val = numMoves;
      this.stats.numberOfRepeatedTiles.val = repeatedTiles;
      this.stats.totalRepeatedTiles.val = totalRepeated;
      this.stats.mostRepeatedTile.val = mostRepeated;
      this.stats.productivity.val = newMapData.productivity;
      this.stats.time.val =
        Math.floor(newMapData.elapsedTime / 1000) + " seconds";
    }
  }
};
</script>

<style scoped>
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

td,
th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}
</style>
