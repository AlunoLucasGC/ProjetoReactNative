import "./global.css";
import { useState } from "react";
import { StatusBar, View, Text, Pressable } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import CaixaScreen from "./telas/CaixaScreen";

export default function App(){
    return (
        <SafeAreaProvider>
            <CaixaScreen>
                
            </CaixaScreen>
        </SafeAreaProvider>
    )
}