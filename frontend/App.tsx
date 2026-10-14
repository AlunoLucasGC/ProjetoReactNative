
import "./global.css";

import { useState } from "react";
import { SafeAreaView, View, Text, Pressable, StatusBar } from "react-native";

import ClientesScreen from "./telas/ClientesScreen";
import VeiculosScreen from "./telas/VeiculosScreen";
import OrdensServicoScreen from "./telas/OrdensServicoScreen";

type Tela = "clientes" | "veiculos" | "ordens";

export default function App() {
    const [tela, setTela] = useState<Tela>("clientes");

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />

            {/* Conteúdo da tela selecionada */}
            <View className="flex-1">
                {tela === "clientes" && <ClientesScreen />}

                {tela === "veiculos" && <VeiculosScreen />}

                {tela === "ordens" && <OrdensServicoScreen />}
            </View>

            {/* Navegação inferior */}
            <View className="flex-row border-t border-slate-200 bg-white px-2 py-2">
                <Pressable
                    onPress={() => setTela("clientes")}
                    className={`flex-1 items-center rounded-xl py-3 ${
                        tela === "clientes" ? "bg-blue-50" : ""
                    }`}
                >
                    <Text className="text-xl">👥</Text>
                    <Text
                        className={`mt-1 text-xs font-bold ${
                            tela === "clientes"
                                ? "text-blue-700"
                                : "text-slate-500"
                        }`}
                    >
                        Clientes
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setTela("veiculos")}
                    className={`flex-1 items-center rounded-xl py-3 ${
                        tela === "veiculos" ? "bg-blue-50" : ""
                    }`}
                >
                    <Text className="text-xl">🚗</Text>
                    <Text
                        className={`mt-1 text-xs font-bold ${
                            tela === "veiculos"
                                ? "text-blue-700"
                                : "text-slate-500"
                        }`}
                    >
                        Veículos
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setTela("ordens")}
                    className={`flex-1 items-center rounded-xl py-3 ${
                        tela === "ordens" ? "bg-blue-50" : ""
                    }`}
                >
                    <Text className="text-xl">🔧</Text>
                    <Text
                        className={`mt-1 text-xs font-bold ${
                            tela === "ordens"
                                ? "text-blue-700"
                                : "text-slate-500"
                        }`}
                    >
                        Ordens de serviço
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
