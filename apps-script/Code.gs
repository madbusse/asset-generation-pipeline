/**
 * Securely retrieves a secret from Google Cloud Secret Manager.
 * @param {string} secretName - The name of the secret in GCP.
 * @return {string} The raw API key value.
 */
function getSecret(secretName) {
  const projectId = "298835103165";
  const version = "latest";
  const url = `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}/versions/${version}:access`;
  
  const response = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken(),
      Accept: "application/json"
    }
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Secret Manager Error: ${response.getContentText()}`);
  }

  const payload = JSON.parse(response.getContentText());
  const decoded = Utilities.base64Decode(payload.payload.data);
  return Utilities.newBlob(decoded).getDataAsString();
}

/**
 * Generates asset variations using Nano Banana.
 * Works in-place, pulling and posting links to the Sheet.
 */
function generateAssetVariations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues(); // Gets all rows
  const NANO_BANANA_API_KEY = getSecret("NANO_BANANA_API_KEY");
  const NANO_BANANA_ENDPOINT= "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent"

  // Iterate through rows (skipping header)
  for (let i = 1; i < data.length; i++) {
    // let prompt = data[i][7]; // prompt in col H
    let prompt = "make an image of a banana"
    
    const payload = {
      "contents": [{
        "parts": [{ "text": prompt }]
      }],
      "generationConfig": {
        "responseModalities": ["IMAGE"] 
      }
    };

    const options = {
      "method": "post",
      "headers": { "x-goog-api-key": NANO_BANANA_API_KEY }, // Use this specific header for Gemini
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
    };

    const response = UrlFetchApp.fetch(NANO_BANANA_ENDPOINT, options);
    const result = JSON.parse(response.getContentText());

    // Extract the base64 image data from the response
    const base64Data = result.candidates[0].content.parts[0].inlineData.data;
    const imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/png", `Variation_${i}.png`);
    
    // Save to GDrive
    let folder = DriveApp.getFolderById("Asset Generation Project/Assets");
    let file = folder.createFile(imageBlob).setName("Variation_" + i);
    
    // Update Sheet with Link
    sheet.getRange(i + 1, 9).setValue(file.getUrl()); // Column I
  }
}
