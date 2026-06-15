/* Roostr — coffee supporters wall.
   When PayPal emails you that someone bought a coffee, add them here
   (newest entry at the TOP) and redeploy. Fields:
     name – how to credit them, e.g. "Jane D."   [required]
     cups – how many cups; defaults to 1          [optional]
     note – a short message to show under the name [optional, keep it short]
   You are the editor of this wall — only add people who actually paid,
   and skip the name (use "A kind stranger") if they asked to stay anonymous. */
const SUPPORTERS = [
  // { name: "Jane D.", cups: 2, note: "the blue whale one got me" },
  // { name: "Sam R." },
];
if (typeof module !== "undefined") module.exports = SUPPORTERS;
