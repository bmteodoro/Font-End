require("dotenv").config();

const db = require("../models/nedb"); // Define o MODEL que vamos usar
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const axios = require('axios')
const cheerio = require('cheerio')

const sites = [
  {
      name: 'abola',
      address: 'https://www.abola.pt/Nnh/Noticias',
      base: 'https://www.abola.pt'
  },
  {
      name: 'record',
      address: 'https://www.record.pt/futebol/futebol-nacional/liga-bwin/sporting?ref=Masterpage_MenuDestaque',
      base: 'https://www.record.pt'
  },
  {
      name: 'ojogo',
      address: 'https://www.ojogo.pt/futebol/1a-liga/sporting.html',
      base: 'https://www.ojogo.pt'
  },
  {
      name: 'maisfutebol',
      address: 'https://maisfutebol.iol.pt/ultimas/',
      base: 'https://maisfutebol.iol.pt'
  },
  {
      name: 'sapo',
      address: 'https://desporto.sapo.pt/futebol/competicao/primeira-liga-2/noticias',
      base: 'https://desporto.sapo.pt'
  }
]

const articles = []




function authenticateToken(req, res) {
    console.log("Authorizing...");
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) {
      console.log("Null token");
      return res.sendStatus(401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.email = user;
    });
  }
  
  const nodemailer = require("nodemailer");
  const { response } = require("express");
  
  async function sendEmail(recipients, confirmationToken) {

    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user, 
        pass: testAccount.pass,
      },
    });
    
    let info = await transporter.sendMail({
      from: '"Noticias do Sporting" <the_fan@fans,com.pt>', 
      to: recipients, 
      subject: "Sporting API register confirmation ✔", 
      text: "Pending account activation",
      html: "<p><b>Pending account activation</b></p>"+"<p><a href="+"http://localhost:8888/api/auth/confirm/"+ confirmationToken + ">Click here to activate your account!</a></p>"
    });
    console.log("O erro está aqui")
    console.log("Message sent: %s", info.messageId);

    console.log(
      "Preview URL: %s",
      nodemailer.getTestMessageUrl(info)
    );
  }
  
  exports.verifyUser = async (req, res) => {
    const confirmationCode = req.params.confirmationCode;
    db.crUd_ativate(confirmationCode);
    const reply = { message: "User account has been activated!" };
    console.log(reply);
    return res.send(reply);
  };
  
  exports.register = async (req, res) => {
    console.log("Register a new user");
    if (!req.body) {
      return res.status(400).send({
        message: "Content must not be empty!",
      });
    }
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const email = req.body.email;
    const password = hashPassword;
    const confirmationToken = jwt.sign(
      req.body.email,
      process.env.ACCESS_TOKEN_SECRET
    );
    db.Crud_register(email, password, confirmationToken)
      .then((data) => {
        sendEmail(email, confirmationToken).catch(console.error);
        res.status(201).send({
          message:
            "User created successfully, please confirm your email to activate your account!",
        });
        console.log("Controller - user registered: ");
        console.log(JSON.stringify(data));
      })
      .catch((response) => {
        console.log("controller - register:");
        console.log(response);
        return res.status(400).send(response);
      });
  };
  
  
  exports.login = async (req, res) => {
    console.log("User authentication");
    if (!req.body) {
      return res.status(400).send({
        message: "Content must not be empty!",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const email = req.body.email;
    const password = hashPassword;
    db.cRud_login(email) //
      .then(async (data) => {
        if (await bcrypt.compare(req.body.password, data.password)) {
          const user = { name: email };
          const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
          res.json({ accessToken: accessToken });
          console.log("Resposta da consulta à base de dados: ");
          console.log(JSON.stringify(data));
        } else {
          console.log("Incorrect Password");
          return res.status(401).send({ erro: "That password was incorrect. Please try again!" });
        }
      })
      .catch((response) => {
        console.log("controller:");
        console.log(response);
        return res.status(400).send(response);
      });
    };


exports.findAll = (req, res) => {
  authenticateToken(req, res);
  if (req.email != null) {
    // utilizador autenticado
    sites.forEach(site => {
        axios.get(site.address)
            .then(response =>{
            const html = response.data
            const $ = cheerio.load(html)

            $('a:contains("Sporting")', html).each(function(){
                const title = $(this).text()
                const url = $(this).attr('href')
                articles.push({
                    title,
                    url: site.base + url,
                    source: site.name
                    })            
            })

        })
    })
    return res.send(articles);
  }
}

exports.findOne = (req, res) => {
  authenticateToken(req, res);
  if (req.email != null) {
    // utilizador autenticado
    const siteId = req.params.siteId

    const siteAddress = sites.filter(site => site.name == siteId)[0].address
    const siteBase = sites.filter(site => site.name == siteId)[0].base

    axios.get(siteAddress)
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)
            const specificArticles = []
            $('a:contains("Sporting")', html).each(function () {
                const title = $(this).text()
                const url = $(this).attr('href')
                specificArticles.push({
                    title,
                    url: siteBase + url,
                    source: siteId
                })
            })
            res.json(specificArticles)
        }).catch(err => console.log(err))
  }
}

