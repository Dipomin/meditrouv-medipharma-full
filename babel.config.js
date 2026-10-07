module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Requis par react-native-reanimated (swipes des alertes) : doit rester
    // en dernier. Nécessite un redémarrage de Metro après modification.
    plugins: ["react-native-reanimated/plugin"],
  };
};
