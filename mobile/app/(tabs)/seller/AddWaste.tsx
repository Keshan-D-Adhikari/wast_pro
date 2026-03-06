import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function AddWaste(){

return(

<View style={styles.container}>

<Text style={styles.title}>Add Waste</Text>

<TextInput
placeholder="Waste Type (Plastic, Paper)"
style={styles.input}
/>

<TextInput
placeholder="Weight (kg)"
style={styles.input}
/>

<TextInput
placeholder="Price per kg"
style={styles.input}
/>

<TouchableOpacity style={styles.btn}>
<Text style={styles.btnText}>Post Waste</Text>
</TouchableOpacity>

</View>

)
}

const styles = StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
padding:20
},

title:{
fontSize:24,
fontWeight:"bold",
marginBottom:20
},

input:{
borderWidth:1,
borderColor:"#ccc",
padding:12,
borderRadius:10,
marginBottom:10
},

btn:{
backgroundColor:"#4F772D",
padding:15,
borderRadius:10,
alignItems:"center"
},

btnText:{
color:"#fff"
}

})