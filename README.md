# Asset Generation Pipeline

The goal of this project is to harness Google Apps Scripts and an Image Generation Model to create variations of an asset.

## Implementation Plan
- Assets are stored in GDrive and linked in a [Sheet](https://docs.google.com/spreadsheets/d/1RP_GSfcMqos1uhpGtE4jpT2LiZzId6C4iMyINdZZyjY/edit?usp=sharing).
- Apps script grabs image and sends it to Nano Banana to generate asset variations.
- Apps script re-uploads assets to Sheet.

## AI Tools
- Nano Banana for asset re-generation

## Questions
- How do we empower the user to control what kind of assets are generated? (e.g. provide text descriptions)
- How do we optimize latency of asset generation? (if generating multiple assets, do so in parallel)
- How do we enforce guardrails so the AI does not tamper with any branded assets (preserving brand integrity)?
