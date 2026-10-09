import { View, Text, Pressable } from "react-native";

//Função usada para solicitar a abertura de outra página
type Props = {
    navegar: (pagina: string) => void;
};

export default function Teste({ navegar }: Props) {
    return (
        <View className="flex-1 justify-center px-10">

            <View className="mb-8 rounded-2xl bg-blue-200 px-10 py-6">
                <Text className="text-center font-bold text-gray-700 text-2xl">
                    Bem-vindo ao nosso aplicativo!
                </Text>
            </View>

            
        </View>
    );


}