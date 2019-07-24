<template>
  <div id="app">
    <BotMap />
  </div>
</template>

<script>
import BotMap from "./components/BotMap.vue";

export default {
  name: "app",
  components: {
    BotMap
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
