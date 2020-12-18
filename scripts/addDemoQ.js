const mongoose = require("mongoose");
const Que = require("../models/question");
require("dotenv").config();

mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true },
  (err) => {
    if (err) {
      console.error("Error in COnnecting Mongo");
      process.exit(1);
    }
    console.log("Mongo Connection Successfull");
    var domains = ["technical", "management", "design"];
    var descType = ["descr", "oneline"];
    var objType = ["multic", "singlec"];
    var optionsData = [
      "option 1",
      "some lengthy long option with random line dadknkada djgaugdua djdhsg dvs dadknkada djgaugdua djdhsg dvsdadknkada djgaugdua djdhsg dvs ",
      "option 3 a medium sized option length dadkssjbd djbqjdb",
      "option 4 with again random data",
    ];
    var count = 0;
    domains.forEach((domain) => {
      descType.forEach((qType) => {
        for (var i = 0; i < 10; i++) {
          new Que({
            qDomain: domain,
            qType: qType,
            answer: "Actual Answer of This Question",
            question: `${domain} question of ${qType} type number ${i + 1}`,
          })
            .save()
            .then((q) => {
              console.log(
                "Que " +
                  ++count +
                  " " +
                  q.qDomain +
                  " " +
                  q.qType +
                  " saved: " +
                  q.id
              );
            })
            .catch((error) => {
              console.log("Error: " + error.message);
            });
        }
      });
      objType.forEach((qType) => {
        for (var i = 0; i < 10; i++) {
          new Que({
            qDomain: domain,
            qType: qType,
            answer: "Actual Answer of This Question",
            question: `${domain} question of ${qType} type number ${i + 1}`,
            options: optionsData,
          })
            .save()
            .then((q) => {
              console.log(
                "Que " +
                  ++count +
                  " " +
                  q.qDomain +
                  " " +
                  q.qType +
                  " saved: " +
                  q.id
              );
            })
            .catch((error) => {
              console.log("Error: " + error.message);
            });
        }
      });
    });
    // only descriptive question for documenation
    descType.forEach((qType) => {
      for (var i = 0; i < 10; i++) {
        new Que({
          qDomain: "documentation",
          qType: qType,
          answer: "Actual Answer of This Question",
          question: `documentation question of ${qType} type number ${i + 1}`,
        })
          .save()
          .then((q) => {
            console.log(
              "Que " +
                ++count +
                " " +
                q.qDomain +
                " " +
                q.qType +
                " saved: " +
                q.id
            );
          })
          .catch((error) => {
            console.log("Error: " + error.message);
          });
        }
    });
  }
);
