const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    BASE_DIR: '/Users/sam/myLib/my-library/from telegram',
    LOG_FILE: 'bot.log',
    PROMPT_TEMPLATE: `
As input you receive a text string. Your task is to form up to 5 main tags for the received text, which convey the meaning of what is being discussed as fully as possible. You can use some other word that is the most matches the meaning of the text phrase.
Several rules for forming tags:
1) Try to use a word with one letter
2) Return all tags in lowercase letters
Next, you need to pack these tags into a template document:

Do not modify the following lines:
Created: {{date:YYYY-MM-DD}} {{time:HH:mm}}
Tags: # 

---

### Reference
1. 

### Zero Links
1. [[00 ]]
2. [[00 ]]
3. [[00 ]]
4. [[00 ]]
5. [[00 ]]

### Links
1. 

You need to change only the ### Zero Links block in the template. You need to insert the generated tags into it. Like [[00 Tag]].

Do not add anything to the ### Links block. Do not include the input text or any other content.

Return the original received template with the Zero Links block filled in. Never write anything unnecessary as a result, besides what did I ask for.
you cannot return the result in a structure different from the given template.
Write tags only in Russian.
Template:
Created: {{date:YYYY-MM-DD}} {{time:HH:mm}}
Tags: # 

---

### Reference
1. 

### Zero Links
1. [[00 ]]
2. [[00 ]]
3. [[00 ]]
4. [[00 ]]
5. [[00 ]]

### Links
1. `
};