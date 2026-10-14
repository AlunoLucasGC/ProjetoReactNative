import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

type Cliente = {
    id: string;
    nome?: string;
    telefone?: string;
    email?: string;
    cpf?: string;
    endereco?: string;
};

type FormCliente = {
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
    endereco: string;
};

// Android Emulator: use 10.0.2.2. On a physical phone, replace it with your PC's local IPv4.
// Expo Web / browser on the same computer: use http://localhost:3000.
const API_URL = 'http://10.0.2.2:3000';
const FORM_VAZIO: FormCliente = { nome: '', telefone: '', email: '', cpf: '', endereco: '' };

function Campo({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}) {
    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-semibold text-slate-700">{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder ?? label}
                placeholderTextColor="#94A3B8"
                keyboardType={keyboardType}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-800"
            />
        </View>
    );
}

export default function ClientesScreen() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [modal, setModal] = useState<'form' | 'detalhes' | null>(null);
    const [selecionado, setSelecionado] = useState<Cliente | null>(null);
    const [form, setForm] = useState<FormCliente>(FORM_VAZIO);

    const carregarClientes = useCallback(async (refresh = false) => {
        if (refresh) setAtualizando(true);
        else setCarregando(true);
        try {
            const resposta = await fetch(`${API_URL}/clientes`);
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados?.erro ?? 'Não foi possível carregar os clientes.');
            setClientes(Array.isArray(dados) ? dados : []);
        } catch (erro) {
            Alert.alert('Erro de conexão', erro instanceof Error ? `${erro.message}\n\nConfira se o backend está rodando e se API_URL está correta.` : 'Não foi possível conectar à API.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    useEffect(() => { void carregarClientes(); }, [carregarClientes]);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return clientes;
        return clientes.filter((cliente) =>
            [cliente.nome, cliente.telefone, cliente.email, cliente.cpf]
                .some((valor) => (valor ?? '').toLowerCase().includes(termo)),
        );
    }, [clientes, busca]);

    function novoCliente() {
        setSelecionado(null);
        setForm(FORM_VAZIO);
        setModal('form');
    }

    async function consultarCliente(cliente: Cliente) {
        try {
            const resposta = await fetch(`${API_URL}/clientes/${cliente.id}`);
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados?.erro ?? 'Não foi possível consultar este cliente.');
            setSelecionado(dados);
            setModal('detalhes');
        } catch (erro) {
            Alert.alert('Erro', erro instanceof Error ? erro.message : 'Não foi possível consultar o cliente.');
        }
    }

    function editarCliente(cliente: Cliente) {
        setSelecionado(cliente);
        setForm({
            nome: cliente.nome ?? '', telefone: cliente.telefone ?? '', email: cliente.email ?? '',
            cpf: cliente.cpf ?? '', endereco: cliente.endereco ?? '',
        });
        setModal('form');
    }

    async function salvarCliente() {
        if (!form.nome.trim()) {
            Alert.alert('Campo obrigatório', 'Informe o nome do cliente.');
            return;
        }
        setSalvando(true);
        try {
            const editando = Boolean(selecionado?.id);
            const resposta = await fetch(editando ? `${API_URL}/clientes/${selecionado!.id}` : `${API_URL}/clientes`, {
                method: editando ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(dados?.erro ?? 'Não foi possível salvar o cliente.');
            setModal(null);
            await carregarClientes(true);
            Alert.alert('Sucesso', editando ? 'Cliente atualizado.' : 'Cliente cadastrado.');
        } catch (erro) {
            Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao salvar o cliente.');
        } finally {
            setSalvando(false);
        }
    }

    function confirmarExclusao(cliente: Cliente) {
        Alert.alert('Excluir cliente?', `Deseja excluir ${cliente.nome ?? 'este cliente'}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: () => { void excluirCliente(cliente); } },
        ]);
    }

    async function excluirCliente(cliente: Cliente) {
        try {
            const resposta = await fetch(`${API_URL}/clientes/${cliente.id}`, { method: 'DELETE' });
            if (!resposta.ok) {
                const dados = await resposta.json().catch(() => ({}));
                throw new Error(dados?.erro ?? 'Não foi possível excluir o cliente.');
            }
            if (selecionado?.id === cliente.id) setModal(null);
            await carregarClientes(true);
            Alert.alert('Sucesso', 'Cliente excluído.');
        } catch (erro) {
            Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao excluir o cliente.');
        }
    }

    function alterar(campo: keyof FormCliente, valor: string) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    const inicial = (nome?: string) => (nome?.trim().charAt(0).toUpperCase() || 'C');

    return (
        <View className="flex-1 bg-slate-50">
            <View className="bg-blue-700 px-5 pb-6 pt-5">
                <Text className="text-sm font-semibold text-blue-100">OFICINAPRO  /  CADASTROS</Text>
                <Text className="mt-2 text-3xl font-extrabold text-white">Clientes</Text>
                <Text className="mt-1 text-sm text-blue-100">Gerencie os clientes da oficina.</Text>
                <View className="mt-5 flex-row items-center rounded-2xl bg-white/15 px-4 py-3">
                    <Text className="mr-2 text-lg text-white">⌕</Text>
                    <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar por nome, telefone ou e-mail" placeholderTextColor="#DBEAFE" className="flex-1 text-sm text-white" />
                </View>
            </View>

            <View className="-mt-3 flex-1 rounded-t-3xl bg-slate-50 px-4 pt-5">
                <View className="mb-4 flex-row items-center justify-between">
                    <View>
                        <Text className="text-lg font-bold text-slate-900">Clientes cadastrados</Text>
                        <Text className="mt-1 text-sm text-slate-500">{clientes.length} registro(s)</Text>
                    </View>
                    <Pressable onPress={novoCliente} className="rounded-xl bg-blue-600 px-4 py-3 active:bg-blue-700">
                        <Text className="font-bold text-white">＋ Novo</Text>
                    </Pressable>
                </View>

                {carregando ? (
                    <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563EB" /><Text className="mt-3 text-slate-500">Carregando clientes...</Text></View>
                ) : (
                    <FlatList
                        data={filtrados}
                        keyExtractor={(item) => item.id}
                        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { void carregarClientes(true); }} tintColor="#2563EB" />}
                        contentContainerStyle={{ paddingBottom: 28, flexGrow: 1 }}
                        ListEmptyComponent={<View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8"><Text className="text-3xl">👥</Text><Text className="mt-3 text-lg font-bold text-slate-800">Nenhum cliente encontrado</Text><Text className="mt-1 text-center text-sm text-slate-500">Cadastre um cliente para começar.</Text></View>}
                        renderItem={({ item }) => (
                            <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <Pressable onPress={() => { void consultarCliente(item); }} className="flex-row items-center">
                                    <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-100"><Text className="text-lg font-extrabold text-blue-700">{inicial(item.nome)}</Text></View>
                                    <View className="ml-3 flex-1">
                                        <Text className="text-base font-bold text-slate-900">{item.nome || 'Cliente sem nome'}</Text>
                                        <Text className="mt-1 text-sm text-slate-500">{item.telefone || 'Telefone não informado'}</Text>
                                        {!!item.email && <Text className="mt-0.5 text-sm text-slate-500">{item.email}</Text>}
                                    </View>
                                    <Text className="text-2xl text-slate-400">›</Text>
                                </Pressable>
                                <View className="mt-4 flex-row border-t border-slate-100 pt-3">
                                    <Pressable onPress={() => editarCliente(item)} className="mr-2 flex-1 rounded-xl bg-blue-50 py-2.5"><Text className="text-center font-bold text-blue-700">Editar</Text></Pressable>
                                    <Pressable onPress={() => confirmarExclusao(item)} className="flex-1 rounded-xl bg-red-50 py-2.5"><Text className="text-center font-bold text-red-600">Excluir</Text></Pressable>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>

            <Modal visible={modal !== null} animationType="slide" transparent onRequestClose={() => setModal(null)}>
                <View className="flex-1 justify-end bg-slate-950/40">
                    <View className="max-h-[92%] rounded-t-3xl bg-white px-5 pb-8 pt-4">
                        <View className="mb-4 flex-row items-center justify-between">
                            <Text className="text-xl font-extrabold text-slate-900">{modal === 'detalhes' ? 'Detalhes do cliente' : selecionado ? 'Editar cliente' : 'Novo cliente'}</Text>
                            <Pressable onPress={() => setModal(null)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"><Text className="text-lg text-slate-700">✕</Text></Pressable>
                        </View>
                        {modal === 'detalhes' && selecionado ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="mb-4 items-center rounded-2xl bg-blue-50 p-5"><View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100"><Text className="text-2xl font-extrabold text-blue-700">{inicial(selecionado.nome)}</Text></View><Text className="mt-3 text-xl font-extrabold text-slate-900">{selecionado.nome}</Text><Text className="mt-1 text-sm text-slate-500">ID: {selecionado.id}</Text></View>
                                {[['Telefone', selecionado.telefone], ['E-mail', selecionado.email], ['CPF', selecionado.cpf], ['Endereço', selecionado.endereco]].map(([label, value]) => <View key={label} className="mb-3 rounded-xl border border-slate-200 p-3"><Text className="text-xs font-bold uppercase text-slate-400">{label}</Text><Text className="mt-1 text-base text-slate-800">{value || 'Não informado'}</Text></View>)}
                                <Pressable onPress={() => editarCliente(selecionado)} className="mt-2 rounded-xl bg-blue-600 py-4"><Text className="text-center font-bold text-white">Editar cliente</Text></Pressable>
                                <Pressable onPress={() => confirmarExclusao(selecionado)} className="mt-3 rounded-xl bg-red-50 py-4"><Text className="text-center font-bold text-red-600">Excluir cliente</Text></Pressable>
                            </ScrollView>
                        ) : (
                            <>
                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <Campo label="Nome completo *" value={form.nome} onChangeText={(v) => alterar('nome', v)} placeholder="Ex.: Mariana Costa" />
                                    <Campo label="Telefone" value={form.telefone} onChangeText={(v) => alterar('telefone', v)} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
                                    <Campo label="E-mail" value={form.email} onChangeText={(v) => alterar('email', v)} placeholder="cliente@email.com" keyboardType="email-address" />
                                    <Campo label="CPF" value={form.cpf} onChangeText={(v) => alterar('cpf', v)} placeholder="000.000.000-00" />
                                    <Campo label="Endereço" value={form.endereco} onChangeText={(v) => alterar('endereco', v)} placeholder="Rua, número, bairro e cidade" />
                                </ScrollView>
                                <Pressable disabled={salvando} onPress={() => { void salvarCliente(); }} className={`mt-3 rounded-xl py-4 ${salvando ? 'bg-blue-300' : 'bg-blue-600'}`}><Text className="text-center font-extrabold text-white">{salvando ? 'Salvando...' : selecionado ? 'Salvar alterações' : 'Cadastrar cliente'}</Text></Pressable>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
