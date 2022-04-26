import microsoftOutlook from "../../microsoft_outlook.app.mjs";

export default {
  type: "action",
  key: "microsoft_outlook-update-contact",
  version: "0.0.1",
  name: "Update Contact",
  description: "Add a contact to the root Contacts folder, [See the docs](https://docs.microsoft.com/en-us/graph/api/user-post-contacts)",
  props: {
    microsoftOutlook,
    contact: {
      propDefinition: [
        microsoftOutlook,
        "contact",
      ],
    },
    givenName: {
      label: "Given name",
      description: "Given name of the contact",
      type: "string",
      optional: true,
    },
    surname: {
      label: "Surname",
      description: "Surname of the contact",
      type: "string",
      optional: true,
    },
    emailAddresses: {
      label: "Email adresses",
      description: "Email addresses",
      type: "string[]",
      optional: true,
    },
    businessPhones: {
      label: "Recipients",
      description: "Array of phone numbers",
      type: "string[]",
      optional: true,
    },
    expand: {
      propDefinition: [
        microsoftOutlook,
        "expand",
      ],
      description: "Additional contact details, [See object definition](https://docs.microsoft.com/en-us/graph/api/resources/contact)",
    },
  },
  async run({ $ }) {
    const emailAddresses = this.emailAddresses && this.emailAddresses.length ?
      this.emailAddresses.map((a, i) => ({
        address: a,
        name: `Email #${i + 1}`,
      })) :
      undefined;
    const response = await this.microsoftOutlook.updateContact({
      $,
      contactId: this.contact,
      data: {
        givenName: this.givenName,
        surname: this.surname,
        emailAddresses,
        businessPhones: this.businessPhones,
        ...this.expand,
      },
    });
    $.export("$summary", "Contact has been updated.");
    return response;
  },
};