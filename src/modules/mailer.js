const path = require("path");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const exphbs = require("express-handlebars");

const { host, port, user, pass } = require("../config/mailer.json");

const transport = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass }
});

transport.use(
  "compile",
  hbs({
    viewEngine: exphbs.create({
      partialsDir: path.resolve("./src/resources/mail/partials"),
      layoutsDir: path.resolve("./src/resources/mail/")
    }),
    viewPath: path.resolve("./src/resources/mail/"),
    extNamme: ".html"
  })
);

module.exports = transport;
