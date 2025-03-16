const generator = require("generate-password");

function generateRandomPassword() {
  //   password should contain atleast 1 uppercase, 1 lowercase, 1 number and 1 special character
  //npm i password-generator
  const password = generator.generate({
    length: 10,
    numbers: true,
    symbols: true,
    uppercase: true,
    exclude: "{}/\\[]()<>~`!$%^&+=|;:,\"?'",
    strict: true,
  });
  console.log(password);
  return password;
}

function passwordValidator(password) {
  // check if password contains atleast 1 uppercase, 1 lowercase, 1 number and 1 special character
  //npm i password-validator
  const schema = new passwordValidator();
  schema
    .is()
    .min(8) // Minimum length 8
    .is()
    .max(1000) // Maximum length 100
    .has()
    .uppercase() // Must have uppercase letters
    .has()
    .lowercase() // Must have lowercase letters
    .has()
    .digits() // Must have digits
    .has()
    .symbols() // Must have symbols
    .has()
    .not()
    .spaces(); // Should not have spaces
  return schema.validate(password);
}

module.exports = {
  generateRandomPassword,
  passwordValidator,
};