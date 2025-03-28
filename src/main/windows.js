// src/main/windows.js
// Ovo je dobra struktura bolje ne moze
const { BrowserWindow, session, net } = require("electron");

// Global variables for windows and views.
let mainWindow;
let doing = false;

function generateHtmlTable(coords) {
  const tableHtml = `
    <table>
      <tr>
        <th>X</th>
        <th>Y</th>
      </tr>
      ${coords
        .map((poly) =>
          poly
            .map(
              (cord) => `
        <tr>
          <td>${cord[0]},</td>
          <td>${cord[1]}</td>
        </tr>
      `,
            )
            .join(""),
        )
        .join("")}
    </table>
  `;
  return tableHtml;
}

// Usage in renderWindow function
function renderWindow(record) {
  const coords = record.fullGeom
    .replace("MULTIPOLYGON (((", "")
    .replace(")))", "")
    .split("), (")
    .map((poly) => poly.split(", ").map((cord) => cord.split(" ").map(Number)));

  const tableHtml = generateHtmlTable(coords);
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadURL(`data:text/html,${tableHtml}`);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    resizable: true,
    maximizable: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "GeoSrbija",
  });

  mainWindow.loadURL("https://a3.geosrbija.rs/katastar");

  //mainWindow.webContents.openDevTools();
  // Inject localStorage values into view1.
  // Presretanje POST zahteva
  // Presretanje POST zahteva na tačan URL (samo ako počinje sa datom adresom)
  // Intercept POST requests
  session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        "https://a3.geosrbija.rs/WebServices/search/SearchProxy.asmx/Search*",
      ],
    },
    async (details, callback) => {
      if (details.method === "POST" && details.uploadData) {
        const postData = details.uploadData[0].bytes.toString();
        //console.log("Intercepted POST Data:", postData);
        if (!doing) {
          doing = true;
          try {
            const response = await fetchResponseBody(details.url, postData);
            if (response.d.records.length > 0) {
              renderWindow(response.d.records[0]);
            }
            //console.log("Response:", response);
            doing = false;
          } catch (error) {
            console.error("Error:", error);
          }
        }
      }

      callback({ cancel: false }); // Allow the original request to proceed
    },
  );

  async function fetchResponseBody(url, postData) {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: "POST",
        url: url,
        headers: {
          "Content-Type": "application/json",
        },
      });

      let responseBody = "";
      request.on("response", (response) => {
        response.on("data", (chunk) => {
          responseBody += chunk.toString();
        });

        response.on("end", () => {
          try {
            const responseBodyJson = JSON.parse(responseBody);
            resolve(responseBodyJson);
          } catch (error) {
            resolve(responseBody);
          }
        });
      });

      request.on("error", (error) => {
        reject(error);
      });

      // Write the POST data and send the request
      request.write(postData);
      request.end();
    });
  }

  // Additional code: injection into view2, dynamic tab creation, IPC for toggling drawer, etc.
  // (For brevity, these sections are omitted. Migrate them as needed following this modular approach.)

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

// -------------------------
// Exports
// -------------------------
module.exports = {
  createMainWindow,
};
