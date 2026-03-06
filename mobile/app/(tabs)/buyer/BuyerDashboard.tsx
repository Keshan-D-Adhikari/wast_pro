import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput
} from "react-native";

import { useRouter } from "expo-router";

export default function BuyerDashboard() {

  const router = useRouter();

  /* Waste Card */

  const WasteCard = ({ type, weight, price }: any) => (

    <View style={styles.card}>

      <Text style={styles.wasteType}>{type}</Text>

      <Text>Weight: {weight} kg</Text>

      <Text>Price: Rs {price}/kg</Text>

      <TouchableOpacity
        style={styles.buyBtn}
        onPress={() => router.push("/(tabs)/buyer/BuyWaste")}
      >
        <Text style={styles.buyText}>Buy</Text>
      </TouchableOpacity>

    </View>

  );

  return (

    <ScrollView style={styles.container}>

      {/* HEADER */}

      <Text style={styles.header}>Buyer Dashboard</Text>

      <Text style={styles.sub}>
        Find recyclable waste near you
      </Text>

      {/* SEARCH */}

      <TextInput
        placeholder="Search waste (Plastic, Paper...)"
        style={styles.search}
      />

      {/* STATS */}

      <View style={styles.statsRow}>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text>Listings</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>5</Text>
          <Text>Orders</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text>Suppliers</Text>
        </View>

      </View>

      {/* WASTE LIST */}

      <Text style={styles.section}>Available Waste</Text>

      <WasteCard
        type="Plastic Waste"
        weight="12"
        price="85"
      />

      <WasteCard
        type="Paper Waste"
        weight="8"
        price="60"
      />

      <WasteCard
        type="Glass Waste"
        weight="5"
        price="70"
      />

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F5F9F4",
    padding:20,
    paddingTop:60
  },

  header:{
    fontSize:26,
    fontWeight:"700"
  },

  sub:{
    color:"#6B7280",
    marginBottom:20
  },

  search:{
    borderWidth:1,
    borderColor:"#ccc",
    padding:12,
    borderRadius:10,
    marginBottom:20
  },

  statsRow:{
    flexDirection:"row",
    justifyContent:"space-between",
    marginBottom:25
  },

  statCard:{
    backgroundColor:"#fff",
    padding:15,
    borderRadius:12,
    width:"30%",
    alignItems:"center"
  },

  statNumber:{
    fontSize:20,
    fontWeight:"700"
  },

  section:{
    fontSize:18,
    fontWeight:"600",
    marginBottom:10
  },

  card:{
    backgroundColor:"#fff",
    padding:15,
    borderRadius:12,
    marginBottom:12
  },

  wasteType:{
    fontSize:16,
    fontWeight:"600",
    marginBottom:5
  },

  buyBtn:{
    backgroundColor:"#4F772D",
    padding:10,
    borderRadius:8,
    marginTop:10,
    alignItems:"center"
  },

  buyText:{
    color:"#fff",
    fontWeight:"600"
  }

});