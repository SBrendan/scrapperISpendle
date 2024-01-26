import * as cheerio from "cheerio";
import * as puppeteer from "puppeteer";
import firebase from "./firebase.js";
import got from "got";
import { CookieJar, Cookie } from "tough-cookie";
import Fermentation from "./models/fermentationModel.js";
import config from "./config.js";
import * as fs from "fs/promises";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
} from "firebase/firestore";

const db = getFirestore(firebase);

const littleBockLogin = "https://www.littlebock.fr/login?redirect=/";

const fetchData = async (cookie) => {
  try {
    const cookieJar = new CookieJar();
    cookieJar.setCookie(cookie, "https://www.littlebock.fr");

    console.log(config.littleBockConfig.fermentationURL);
    const response = await got(config.littleBockConfig.fermentationURL, {
      cookieJar,
    });
    const $ = cheerio.load(response.body);
    const mutedValues = [];
    $("div.card-box.card-bordered.text-center")
      .children(".text-primary")
      .children("span")
      .each(function (i, value) {
        mutedValues.push($(this).text());
      });
    return mutedValues;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    throw error;
  }
};

const sendPostRequest = async (mutedValues) => {
  try {
    console.log("Fetched Data:", mutedValues);
    /*
      mutedValues[0]: temperature,
      mutedValues[1]: alcool,
      mutedValues[2]: density,
      mutedValues[3]: attenuation,
    */
    if (mutedValues.length !== 4) {
      console.error(
        "Array don't have the correct size. Current size: #%d",
        mutedValues.length
      );
      return;
    }
    const ref = doc(
      collection(db, "fermentation-" + config.littleBockConfig.fermentationID)
    );
    const id = ref.id;
    const fermentation2push = new Fermentation(
      id,
      mutedValues[0],
      mutedValues[1],
      mutedValues[2],
      mutedValues[3],
      new Date().getTime().toString()
    );
    await got.post(config.hostUrl + "/api/new", {
      json: fermentation2push,
    });
    console.log("Save success");
  } catch (error) {
    console.error("Failed to save fermentation:", error.message);
  }
};

const getCookies = async () => {
  const browser = await puppeteer.launch({ slowMo: 10 });
  const page = await browser.newPage();

  await page.goto(littleBockLogin, { waitUntil: "networkidle0" }); // Remplacez par l'URL réelle
  await page.click(".cc-btn.cc-allow", { button: "left" });

  await page.type("#username", config.littleBockConfig.username);
  await page.type("#password", config.littleBockConfig.password);
  await page.waitForSelector('input[name="_submit"]');
  await page.click('input[name="_submit"]');

  //await page.screenshot({ path: "connexion_reussie.png" });

  const cookies = await page.cookies();

  const llcookie = new Cookie();
  if (page.url() != littleBockLogin) {
    await browser.close();
  }
  cookies.forEach((cookie) => {
    if (cookie.name == "PHPSESSID") {
      llcookie.domain = "www.littlebock.fr";
      llcookie.key = cookie.name;
      llcookie.value = cookie.value;
      llcookie.path = cookie.path;
      llcookie.httpOnly = true;
      llcookie.secure = true;
      llcookie.sameSite = "Lax";
      return;
    }
  });

  return llcookie.toString();
};

(async () => {
  try {
    const cookie = await getCookies();
    const mutedValues = await fetchData(cookie);
    await sendPostRequest(mutedValues);
  } catch (error) {
    console.log(error);
  }
})();
