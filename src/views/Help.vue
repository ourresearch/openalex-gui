<template>
  <v-container class="page">
    <div class="help-form">
      <h3 class="text-h3">Get in Touch</h3>
      <p ref="description">Use this form to get in touch with the OpenAlex team, to send a bug report, or to ask
        any questions not answered by the <a href="https://docs.openalex.org/">documentation</a>.</p>

      <v-form
          ref="form"
          lazy-validation
          class="align-center"
      >
        <v-text-field
            v-model="name"
            :rules="nameRules"
            label="Your Name"
            outlined
            required
        ></v-text-field>

        <v-text-field
            v-model="email"
            :rules="emailRules"
            label="Your Email"
            outlined
            required
        ></v-text-field>

        <v-text-field
            v-model="subject"
            :rules="nameRules"
            label="Subject"
            outlined
            required
        ></v-text-field>

        <v-textarea
            v-model="message"
            :rules="messageRules"
            label="Message"
            outlined
            required></v-textarea>

        <v-btn
            color="primary"
            class="mr-4"
            @click="submitForm"
        >
          Submit
        </v-btn>
      </v-form>
      <div v-if="success">
        <br><br>
        <p>Request sent! You will receive an email confirmation shortly. You can reply to that email to send
          any files.</p>
      </div>
      <div v-if="error">
        <br><br>
        <p>Looks like something went wrong with our form. Please email us <a href="mailto:support@openalex.org">support@openalex.org</a>
        </p>
      </div>
    </div>

  </v-container>
</template>

<script>
export default {
  name: "Help",
  metaInfo: {title: "Help"},

  data: () => ({
    name: '',
    nameRules: [
      v => !!v || 'Name is required',
    ],
    subject: '',
    email: '',
    emailRules: [
      v => !!v || 'E-mail is required',
      v => /^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v) || 'E-mail must be valid',
    ],
    topicRules: [
      v => !!v || 'Topic is required',
    ],
    message: '',
    messageRules: [
      v => !!v || 'Message is required',
    ],
    success: false,
    error: false,
  }),

  methods: {
    submitForm() {
      if (this.$refs.form.validate()) {
        // submit form to zendesk API
        fetch(
            'https://openalex.zendesk.com/api/v2/requests.json',
            {
              method: 'POST',
              headers: new Headers({
                'Content-Type': 'application/json'
              }),
              body: JSON.stringify({
                "request": {
                  "subject": this.subject,
                  "comment": {
                    "body": this.message
                  },
                  "requester": {
                    "name": this.name,
                    "email": this.email
                  },
                }
              })
            }
        ).then(response => {
          this.$refs.form.reset();
          this.$refs.form.resetValidation();
          this.$refs.form.$el.style.display = 'none';
          this.$refs.description.style.display = 'none';

          if (response.ok) {
            this.success = true;
          } else {
            this.error = true;
          }
        }).catch(error => {
          console.log(error);
          this.error = true;
        });
      }
    },
  },
}
</script>

<style scoped>

</style>