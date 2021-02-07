const routerConf = (express, app) => {
  app.use("/auth", require("../routes/auth"));
  app.use("/profile", require("../routes/profile"));
};

module.exports = routerConf;
