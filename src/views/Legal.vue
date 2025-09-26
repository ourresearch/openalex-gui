<template>
    <v-container class="mt-12 pt-12">
      <div class="text-h3 mb-6">
        Legal
      </div>
      <ul>
        <li>
            <a href="/conflict-of-interest-policy.pdf" target="_blank">Conflict of Interest Policy</a>
        </li>
        <li>
            <a href="https://docs.google.com/spreadsheets/d/19HJtpWlintDX9J3etqi4AtvJvCwdVN4JnfyVcKICNKI/edit?gid=1539590034#gid=1539590034" target="_blank">Disclosures of Conflicts of Interest</a>
        </li>
        <li>
            <a href="/accessibility-statement.pdf" target="_blank">Accessibility Statement</a>
        </li>
        <li>
            <a href="/OpenAlex_privacy_policy.pdf" target="_blank">OpenAlex Privacy Policy</a>
        </li>
        <li>
            <a href="/OpenAlex_termsofservice.pdf" target="_blank">OpenAlex Terms of Service</a>
        </li>


      </ul>
      
  
    </v-container>
  </template>
  
  <script>
  export default {
    name: "Legal",
    metaInfo() {
      return {
        title: "Legal"
      }
    },
  }
  </script>
  
  <style scoped lang="scss">
  .text-h4 {
    margin-top: 50px;
    margin-bottom: 10px;
  }
  
  blockquote {
    border-left: 5px solid #ddd;
    padding-left: 10px;
    margin: 20px 0;
  }
  p {
    margin-bottom: 20px;
  }
  
  ul {
    padding-left: 15px;
  }
  
  </style>