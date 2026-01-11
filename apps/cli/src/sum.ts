import { add } from "@vinmono/helpers";

const a = Number(process.argv[2]);
const b = Number(process.argv[3]);

console.log("Summing a number");
console.log(add(a, b));
