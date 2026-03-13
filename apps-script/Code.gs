/**
 * Retrieves API Key from Google Cloud Secret Manager.
 */
function getSecret() {
  const secretName = "NANO_BANANA_API_KEY";
  const projectId = PropertiesService.getScriptProperties().getProperty('ASSET_PROJECT_ID');
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
  const data = sheet.getDataRange().getValues();
  const NANO_BANANA_API_KEY = getSecret();
  const NANO_BANANA_ENDPOINT= "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent"

  // Iterate through rows (skipping header)
  for (let i = 3; i < data.length; i++) {
    let prompt = data[i][2]; // prompt in col C
    console.log(prompt);

    // getting image (col B has image link)
    let imageURL = data[i][1]; 
    console.log(imageURL);
    const fileId = imageURL.match(/[-\w]{25,}/);
    console.log(fileId);
    const inputImageBlob = DriveApp.getFileById(fileId).getBlob();
    const base64Image = Utilities.base64Encode(inputImageBlob.getBytes());
    const mimeType = inputImageBlob.getContentType();
    
    const payload = {
      "contents": [{
        "parts": [
          { "text": prompt },
          {
            "inlineData": {
              "mimeType": mimeType,
              "data": base64Image
            }
          }
        ]
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
    const responseImageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/png", `Variation_${i}.png`);
    
    // Save to GDrive
    let folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('ASSET_FOLDER_ID'));
    let file = folder.createFile(responseImageBlob).setName("Variation_" + i);
    
    // Update Sheet with Link
    sheet.getRange(i + 1, 8).setValue(file.getUrl()); // col I
  }
}
