import { View, Text, StyleSheet } from "react-native";

export default function SellerProfile(){

return(

<View style={styles.container}>

<Text style={styles.title}>Seller Profile</Text>

<Text>Name: Nuwan</Text>
<Text>Email: nuwan@email.com</Text>
<Text>Location: Colombo</Text>

</View>

)
}

const styles = StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

title:{
fontSize:24,
fontWeight:"bold",
marginBottom:20
}

})