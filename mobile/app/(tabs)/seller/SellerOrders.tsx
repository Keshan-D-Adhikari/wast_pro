import { View, Text, StyleSheet } from "react-native";

export default function SellerOrders(){

return(

<View style={styles.container}>

<Text style={styles.title}>Orders</Text>

<View style={styles.card}>
<Text>Plastic Waste</Text>
<Text>Buyer: Green Recycling</Text>
<Text>Status: Pending</Text>
</View>

<View style={styles.card}>
<Text>Paper Waste</Text>
<Text>Buyer: Eco Lanka</Text>
<Text>Status: Completed</Text>
</View>

</View>

)
}

const styles = StyleSheet.create({

container:{
flex:1,
padding:20
},

title:{
fontSize:24,
fontWeight:"bold",
marginBottom:20
},

card:{
backgroundColor:"#fff",
padding:15,
borderRadius:10,
marginBottom:10,
elevation:2
}

})