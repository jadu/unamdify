UnAMDify
========

Browserify transform that rewrites AMD modules to be CommonJS compliant.

```javascript
npm install --save-dev unamdify
```

Add to `package.json` (we recommend you use aliasify (`npm install --save-dev aliasify`) to support AMD-style path mappings too.) -
```json
{
  "browserify": {
    "transform": [
      "unamdify",
      "aliasify"
    ]
  },
  "aliasify": {
    "aliases": {
      "bower_components": "./web/bower_components"
    }
  }
}
```
