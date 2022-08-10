
const PersonSchema = ({
    firstName: {
        type: String,
        //required: true
    },
    lastName: {
        type: String,
        //required: true
    },

    birthday: {
        type: String,
        //required: true
    },
    email: {
        type: String,
        //required: true
        //change email to be username
    },
})
module.exports = PersonSchema