<template>


    <div class="operate">

        <div class="left">
            <n-button type="info" style="margin-right: 5px" ghost @click="openCreateWalletModal">
                Create New Wallet
            </n-button>

            <n-button type="info" style="margin-right: 5px" ghost @click="openAddWalletModal">
                Add Existing Wallet
            </n-button>

            <!-- <n-space vertical style="min-width:180px">
                <n-select size="medium" placeholder="choose wallet" :options="walletOptions"
                    :consistent-menu-width="false" />
            </n-space> -->
        </div>


        <div class="right">
            <n-button type="success" style="margin-right: 5px" ghost @click="openCreateProposalModal">
                Create Proposal
            </n-button>

            <n-button type="success" ghost @click="updateSetting">
                Update Setting
            </n-button>
        </div>
    </div>

    <div class="data">
        <n-tabs type="line" animated justify-content="center">
            <n-tab-pane name="proposals" tab="Proposal List">
                <div class="data-body">
                    <n-data-table :columns="columns" :data="proposals!.data" :pagination="pagination"
                        :bordered="false" />
                </div>
            </n-tab-pane>
            <n-tab-pane name="settings" tab="Setting Action">
                <n-empty description="Under development">
                </n-empty>
            </n-tab-pane>

        </n-tabs>


    </div>

    <!--create proposal modal-->
    <n-modal v-model:show="showCreateProposalModal" preset="card" class="create-proposal-modal" :style="bodyStyle"
        title="Create Proposal" size="huge" :bordered="false" :segmented="segmented" :mask-closable="false"
        :close-on-esc="false">

        <n-form ref="formRef" :model="proposalModel" :rules="rules" label-placement="left" label-width="auto"
            require-mark-placement="right-hanging" size="medium" :style="{
                maxWidth: '640px'
            }">
            <n-form-item label="Desc" path="desc">
                <n-input v-model:value="proposalModel.desc" placeholder="Input Desc" maxLength="20" />
            </n-form-item>

            <n-form-item label="Amount(mina)" path="amount">
                <n-input-number v-model:value="proposalModel.amount" placeholder="Input Amount" />
            </n-form-item>

            <n-form-item label="Receiver" path="receiver">
                <n-input v-model:value="proposalModel.receiver" placeholder="Input Receiver Address" />
            </n-form-item>
        </n-form>

        <template #footer>
            <div class="create-proposal-modal-bottom">
                <n-button type="success" style="margin-right: 5px" :disabled="createProposalBtnDisabled" ghost
                    @click="createProposal">
                    Create
                </n-button>
            </div>

        </template>
    </n-modal>

    <!--create new wallet modal-->
    <n-modal v-model:show="showCreateWalletModal" preset="card" class="create-proposal-modal" :style="bodyStyle"
        title="Create New Wallet" size="huge" :bordered="false" :segmented="segmented" :mask-closable="false"
        :close-on-esc="false">

        <div class="modal-content">
            <n-form ref="createWalletFormRef" :model="createWalletModel" :rules="createWalletRules"
                label-placement="top" label-width="auto" require-mark-placement="right-hanging" size="medium">

                <n-grid :cols="24" :x-gap="24">
                    <n-form-item-gi :span="24" label="Wallet Name" path="walletName">
                        <n-input v-model:value="createWalletModel.walletName"
                            placeholder="This name is only stored locally." maxLength="20" />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 1" path="ownerName1">
                        <n-input v-model:value="createWalletModel.ownerName1"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 1" path="ownerAddress1">
                        <n-input v-model:value="createWalletModel.ownerAddress1" placeholder="Input Owner Address 1 " />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 2 (Optional)" path="ownerName2">
                        <n-input v-model:value="createWalletModel.ownerName2"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 2 (Optional)" path="ownerAddress2">
                        <n-input v-model:value="createWalletModel.ownerAddress2" placeholder="Input Owner Address 2" />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 3 (Optional)" path="ownerName3">
                        <n-input v-model:value="createWalletModel.ownerName3"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 3 (Optional)" path="ownerAddress3">
                        <n-input v-model:value="createWalletModel.ownerAddress3" placeholder="Input Owner Address 3" />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 4 (Optional)" path="ownerName4">
                        <n-input v-model:value="createWalletModel.ownerName4"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 4 (Optional)" path="ownerAddress4">
                        <n-input v-model:value="createWalletModel.ownerAddress4" placeholder="Input Owner Address 4" />
                    </n-form-item-gi>

                    <n-form-item-gi :span="24" label="Threshold (Number of signatures required)" path="threshold">
                        <n-input-number v-model:value="createWalletModel.threshold" />
                    </n-form-item-gi>

                </n-grid>

            </n-form>
        </div>
        <template #footer>
            <div class="create-proposal-modal-bottom">
                <n-button type="success" style="margin-right: 5px" ghost :disabled="createBtnDisabled"
                    @click="createWallet">
                    Create
                </n-button>
            </div>

        </template>
    </n-modal>


    <!--add wallet modal-->
    <n-modal v-model:show="showAddWalletModal" preset="card" class="create-proposal-modal" :style="bodyStyle"
        title="Add Existing Wallet" size="huge" :bordered="false" :segmented="segmented" :mask-closable="false"
        :close-on-esc="false">

        <div class="modal-content">
            <n-form ref="addWalletFormRef" :model="addWalletModel" :rules="addWalletRules" label-placement="top"
                label-width="auto" require-mark-placement="right-hanging" size="medium">

                <n-grid :cols="24" :x-gap="24">
                    <n-form-item-gi :span="24" label="Wallet Name" path="walletName">
                        <n-input v-model:value="addWalletModel.walletName"
                            placeholder="This name is only stored locally." maxLength="20" />
                    </n-form-item-gi>
                    <n-form-item-gi :span="24" label="Wallet Address" path="walletAddress">
                        <n-input v-model:value="addWalletModel.walletAddress" placeholder="Input Wallet Address" />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 1" path="ownerName1">
                        <n-input v-model:value="addWalletModel.ownerName1"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 1" path="ownerAddress1">
                        <n-input v-model:value="addWalletModel.ownerAddress1" placeholder="Input Owner Address 1 " />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 2 (Optional)" path="ownerName2">
                        <n-input v-model:value="addWalletModel.ownerName2"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 2 (Optional)" path="ownerAddress2">
                        <n-input v-model:value="addWalletModel.ownerAddress2" placeholder="Input Owner Address 2" />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 3 (Optional)" path="ownerName3">
                        <n-input v-model:value="addWalletModel.ownerName3"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 3 (Optional)" path="ownerAddress3">
                        <n-input v-model:value="addWalletModel.ownerAddress3" placeholder="Input Owner Address 3" />
                    </n-form-item-gi>

                    <n-form-item-gi :span="10" label="Owner Name 4 (Optional)" path="ownerName4">
                        <n-input v-model:value="addWalletModel.ownerName4"
                            placeholder="This name is only stored locally." />
                    </n-form-item-gi>
                    <n-form-item-gi :span="14" label="Owner Address 4 (Optional)" path="ownerAddress4">
                        <n-input v-model:value="addWalletModel.ownerAddress4" placeholder="Input Owner Address 4" />
                    </n-form-item-gi>

                </n-grid>

            </n-form>
        </div>
        <template #footer>
            <div class="create-proposal-modal-bottom">
                <n-button type="success" style="margin-right: 5px" :disabled="addBtnDisabled" ghost @click="addWallet">
                    Add Existing Wallet
                </n-button>
            </div>

        </template>
    </n-modal>



    <!-- <h1> address proof service</h1>

    <div>
        <div>
            
            <div>Public Key: {{ address }} </div>
            <button @click="genAddress">genAddress</button>
        </div>
    </div> -->

</template>
  
<script setup lang="ts">
import { DataTableColumns, FormInst, NButton } from 'naive-ui';
import { PrivateKey, PublicKey, UInt32 } from 'snarkyjs';
import { STORAGE_KEY_WALLET_CONF } from '../common/constant';
import type { Proposal, WalletConfJSON } from '../common/types';

const { isEmptyStr, nano2Mina, mina2Nano,
    message, createLoading, removeLoading } = useUtils();
const { zkappState, getAccount, initZkappInstance,
    compileContract, deployWallet, getAccountJSON,
    createApproverHashes, getApproverHashes, getApproverThreshold } = useZkapp();

const addBtnDisabled = ref<boolean>(false);
const createBtnDisabled = ref<boolean>(false);
const createProposalBtnDisabled = ref<boolean>(false);

// const walletOptions = [
//     {
//         label: "mywallet_0",
//         value: 'song0',
//         disabled: true
//     },
//     {
//         label: 'mywallet_1',
//         value: 'song1'
//     },
// ];

const bodyStyle = {
    'width': '600px',
};
const segmented = {
    content: 'soft',
    footer: 'soft'
};

const { data: proposals, refresh: proposalListRefresh } = await useFetch('/api/getProposals', {
    method: 'GET', params: { contractAddress: zkappState.value.walletPublicKey58 }, pick: ['data']
});

console.log("proposals value: ", proposals.value);

const updateSetting = () => {
    message.info("Under development");
};

const createProposal = async () => {
    if (zkappState.value.walletPublicKey58 == null) {
        message.error("Please add wallet or create wallet first");
        return;
    }
    createProposalBtnDisabled.value = true;
    createLoading("Please wait...");
    type ProposalValue = {
        contractAddress: string;
        contractNonce: number;
        desc: string;
        amount: string;
        receiver: string;
    };

    const desc = proposalModel.value.desc;
    if (isEmptyStr(desc)) {
        message.error("Please input desc");
        return;
    }
    const amount = proposalModel.value.amount;
    const receiver = proposalModel.value.receiver;
    if (isEmptyStr(receiver)) {
        message.error("Please input receiver");
        return;
    }

    const p: ProposalValue = {
        contractAddress: zkappState.value.walletPublicKey58,
        contractNonce: zkappState.value.walletNonce!,
        desc: desc!,
        amount: amount + "",
        receiver: receiver!
    };
    const { data: res } = await useFetch('/api/createProposal', {
        method: 'POST', body: p
    });
    console.log("create proposal res: ", res.value);
    createProposalBtnDisabled.value = false;
    if (res.value === "success") {
        message.success("Create proposal success");
        removeLoading();
        showCreateProposalModal.value = false;
    } else {
        message.error("Create proposal failed");
        removeLoading();
    }
    proposalListRefresh();
};

const showCreateProposalModal = ref(false);
const formRef = ref<FormInst | null>(null);
const proposalModel = ref({
    desc: null,
    amount: 0,
    receiver: null,
});
const rules = {
    desc: {
        required: false,
        trigger: ['blur', 'input'],
        message: 'Please input desc'
    },
    amount: {
        required: true
    },
    receiver: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input receiver address'
    }
};
const openCreateProposalModal = () => {
    showCreateProposalModal.value = true;
};


const showCreateWalletModal = ref(false);
const createWalletFormRef = ref<FormInst | null>(null);
const createWalletModel = ref({
    walletName: null as null | string,
    ownerName1: null as null | string,
    ownerAddress1: null as null | string,
    ownerName2: null as null | string,
    ownerAddress2: null as null | string,
    ownerName3: null as null | string,
    ownerAddress3: null as null | string,
    ownerName4: null as null | string,
    ownerAddress4: null as null | string,
    threshold: 1,
});
const createWalletRules = {
    ownerName1: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input ownerName1'
    },
    ownerAddress1: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input ownerAddress1'
    },
    threshold: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input threshold'
    },
};
const openCreateWalletModal = () => {
    showCreateWalletModal.value = true;
};
const createStatusForBegin = () => {
    createBtnDisabled.value = true;
    createLoading();
};
const createStatusForDone = () => {
    createBtnDisabled.value = false;
    setTimeout(() => {
        removeLoading();
    }, 2000);

};
const createWallet = async () => {
    if (zkappState.value.signerPrivateKey == null) {
        message.error("Please connect signer wallet first");
        return;
    }

    createStatusForBegin();
    if (isEmptyStr(createWalletModel.value.walletName)) {
        message.error("Please input wallet name");
        createStatusForDone();
        return;
    }

    if (isEmptyStr(createWalletModel.value.ownerName1)) {
        message.error("Please input owner name 1");
        createStatusForDone();
        return;
    }
    if (isEmptyStr(createWalletModel.value.ownerAddress1)) {
        message.error("Please input owner address 1");
        createStatusForDone();
        return;
    }

    showCreateWalletModal.value = false;
    const approverThreshold: UInt32 = UInt32.from(createWalletModel.value.threshold);
    zkappState.value.approverThreshold = createWalletModel.value.threshold;

    let approvers: { name: string | null, address: string }[] = [{ name: createWalletModel.value.ownerName1, address: createWalletModel.value.ownerAddress1! }];
    if (!isEmptyStr(createWalletModel.value.ownerAddress2)) {
        approvers.push({ name: createWalletModel.value.ownerName2, address: createWalletModel.value.ownerAddress2! });
    }
    if (!isEmptyStr(createWalletModel.value.ownerAddress3)) {
        approvers.push({ name: createWalletModel.value.ownerName3, address: createWalletModel.value.ownerAddress3! });
    }
    if (!isEmptyStr(createWalletModel.value.ownerAddress4)) {
        approvers.push({ name: createWalletModel.value.ownerName4, address: createWalletModel.value.ownerAddress4! });
    }
    let approverPublicKeys: PublicKey[] = approvers.map(v => PublicKey.fromBase58(v.address));
    zkappState.value.approverHashes = createApproverHashes(approverPublicKeys);

    // generate keys;
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
    const zkAppPublicKey58 = zkAppPublicKey.toBase58();
    // save wallet conf
    let walletConf: WalletConfJSON = {
        walletName: createWalletModel.value.walletName as string,
        walletAddress: zkAppPublicKey58,
        owners: approvers,
    };

    window.localStorage.setItem(STORAGE_KEY_WALLET_CONF, JSON.stringify(walletConf));
    zkappState.value.walletName = addWalletModel.value.walletName;
    zkappState.value.walletPublicKey58 = zkAppPublicKey58;
    zkappState.value.walletPublicKey = zkAppPublicKey;
    zkappState.value.approvers = walletConf.owners;
    initZkappInstance(zkAppPublicKey58!);
    createStatusForDone();

    let vk: { data: string; hash: string } | null = null;
    if (!zkappState.value.hasBeenCompiled) {
        createLoading("Waiting for the contract to compile, this may take a few minutes...");
        vk = await compileContract();
        removeLoading();
    }

    addStatusForBegin();
    createLoading("Waiting for wallet to deploy...");
    let hash = await deployWallet({ zkAppPrivateKey, verificationKey: vk!, approvers: approverPublicKeys, approverThreshold });
    removeLoading();

    const account = await getAccountJSON(zkappState.value.walletPublicKey58!);
    zkappState.value.walletNonce = account?.nonce!;
    zkappState.value.walletBalance = nano2Mina(account?.balance!).toString();
    message.info("deploy transaction hash: " + hash);

    proposalListRefresh();
};



const showAddWalletModal = ref(false);
const addWalletFormRef = ref<FormInst | null>(null);
const addWalletModel = ref({
    walletName: null as null | string,
    walletAddress: null as null | string,
    ownerName1: null as null | string,
    ownerAddress1: null as null | string,
    ownerName2: null as null | string,
    ownerAddress2: null as null | string,
    ownerName3: null as null | string,
    ownerAddress3: null as null | string,
    ownerName4: null as null | string,
    ownerAddress4: null as null | string,
});
const addWalletRules = {
    walletName: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input wallet name'
    },
    walletAddress: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input wallet address'
    },
    ownerName1: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input ownerName1'
    },
    ownerAddress1: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please input ownerAddress1'
    },
};
const openAddWalletModal = () => {
    addWalletModel.value.walletName = null;
    addWalletModel.value.walletAddress = null;
    addWalletModel.value.ownerName1 = null;
    addWalletModel.value.ownerAddress1 = null;
    addWalletModel.value.ownerName2 = null;
    addWalletModel.value.ownerAddress2 = null;
    addWalletModel.value.ownerName3 = null;
    addWalletModel.value.ownerAddress3 = null;
    addWalletModel.value.ownerName4 = null;
    addWalletModel.value.ownerAddress4 = null;
    showAddWalletModal.value = true;
};
const addStatusForBegin = () => {
    addBtnDisabled.value = true;
    createLoading();
};
const addStatusForDone = () => {
    addBtnDisabled.value = false;
    setTimeout(() => {
        removeLoading();
    }, 2000);

};
const addWallet = async () => {
    if (zkappState.value.signerPrivateKey == null) {
        message.error("Please connect signer wallet first");
        return;
    }

    addStatusForBegin();

    if (isEmptyStr(addWalletModel.value.walletName)) {
        message.error("Please input wallet name");
        addStatusForDone();
        return;
    }

    const walletAddress = addWalletModel.value.walletAddress;
    if (isEmptyStr(walletAddress)) {
        message.error("Please input wallet address");
        addStatusForDone();
        return;
    }
    if (isEmptyStr(addWalletModel.value.ownerName1)) {
        message.error("Please input owner name 1");
        addStatusForDone();
        return;
    }
    if (isEmptyStr(addWalletModel.value.ownerAddress1)) {
        message.error("Please input owner address 1");
        addStatusForDone();
        return;
    }

    // check wallet if exist
    const res = await getAccount(walletAddress!);
    if (res?.error != null) {
        message.error("The MultiSig Wallet does not exist");
        addStatusForDone();
        return;
    }

    showAddWalletModal.value = false;
    // save wallet conf
    let walletConf: WalletConfJSON = {
        walletName: addWalletModel.value.walletName as string,
        walletAddress: walletAddress as string,
        owners: [{ name: addWalletModel.value.ownerName1, address: addWalletModel.value.ownerAddress1 }] as { name: string; address: string }[],
    };
    if (!isEmptyStr(addWalletModel.value.ownerAddress2)) {
        walletConf.owners.push({ name: addWalletModel.value.ownerName2 as string, address: addWalletModel.value.ownerAddress2 as string });
    }
    if (!isEmptyStr(addWalletModel.value.ownerAddress3)) {
        walletConf.owners.push({ name: addWalletModel.value.ownerName3 as string, address: addWalletModel.value.ownerAddress3 as string });
    }
    if (!isEmptyStr(addWalletModel.value.ownerAddress4)) {
        walletConf.owners.push({ name: addWalletModel.value.ownerName4 as string, address: addWalletModel.value.ownerAddress4 as string });
    }
    window.localStorage.setItem(STORAGE_KEY_WALLET_CONF, JSON.stringify(walletConf));
    zkappState.value.walletName = addWalletModel.value.walletName;
    zkappState.value.walletPublicKey58 = walletAddress;
    zkappState.value.walletPublicKey = PublicKey.fromBase58(walletAddress!);
    zkappState.value.approvers = walletConf.owners;
    initZkappInstance(walletAddress!);

    zkappState.value.approverHashes = getApproverHashes();
    zkappState.value.approverThreshold = Number(getApproverThreshold().toBigint());

    addStatusForDone();

    if (!zkappState.value.hasBeenCompiled) {
        createLoading("Waiting for the contract to compile, this may take a few minutes...");
        await compileContract();
        removeLoading();
    }

    const account = await getAccountJSON(zkappState.value.walletPublicKey58!);
    zkappState.value.walletNonce = account?.nonce!;
    zkappState.value.walletBalance = nano2Mina(account?.balance!).toString();

    proposalListRefresh();
};



const pagination = false;


// const proposalData: Proposal[] = [
//     {
//         desc: 'test', amount: 2, receiver: 'B62qp5myKYfrN3bUwrN242fZZt3CscyzDHWhM6DT8udqRhfZx2qkmuM',
//         contractAddress: 'B62qpD4T3GcYSNmWUN3g8GVnXLyDECEEaCJ6owtZAbFDPA1zZUBrnKd', contractNonce: 1, signedNum: 0
//     },
//     {
//         desc: 'fund the project', amount: 2.5, receiver: 'B62qp5myKYfrN3bUwrN242fZZt3CscyzDHWhM6DT8udqRhfZx2qkmuM',
//         contractAddress: 'B62qpD4T3GcYSNmWUN3g8GVnXLyDECEEaCJ6owtZAbFDPA1zZUBrnKd', contractNonce: 2, signedNum: 1
//     },
//     {
//         desc: 'support dev', amount: 100.3, receiver: 'B62qp5myKYfrN3bUwrN242fZZt3CscyzDHWhM6DT8udqRhfZx2qkmuM',
//         contractAddress: 'B62qpD4T3GcYSNmWUN3g8GVnXLyDECEEaCJ6owtZAbFDPA1zZUBrnKd', contractNonce: 3, signedNum: 2
//     },
// ];

let createColumns = ({
    viewDetail
}: {
    viewDetail: (p: Proposal) => void
}): DataTableColumns<Proposal> => {
    return [
        {
            title: 'Title',
            key: 'desc',
        },
        {
            title: 'Amount(mina)',
            key: 'amount'
        },
        {
            title: 'Receiver',
            key: 'receiver',
            // width: 510,
            // ellipsis: {
            //     tooltip: true
            // }
        },
        {
            title: 'SignedNum',
            key: 'signedNum'
        },
        {
            title: 'MeetThreshold',
            key: 'meetThreshold',
            render: (val) => {
                if (val.signedNum > zkappState.value.approverThreshold!) {
                    return 'Yes';
                } else {
                    return 'No';
                }
            }
        },
        {
            title: 'Action',
            key: 'actions',
            render(row) {
                return h(
                    NButton,
                    {
                        strong: true,
                        tertiary: true,
                        size: 'small',
                        onClick: () => viewDetail(row)
                    },
                    { default: () => 'view' }
                )
            }
        }
    ]
};


let columns = createColumns({
    viewDetail(row: Proposal) {
        console.info(`proposal id: ${row.id}`);
        navigateTo(`/proposal/${row.id}`);
    }
});

</script>

<style scoped lang="scss">
.operate {
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;

    .left {
        display: flex;
        flex-wrap: nowrap;
    }

    .right {
        display: flex;
        justify-content: flex-end;
        flex-wrap: nowrap;
    }
}

.data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 20px;

    .data-body {
        margin-top: 8px;
    }
}

.modal-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-content: center;
}

.create-proposal-modal {
    padding: 15px;
    border-width: 1px;
    border-style: dashed;
    border-color: green;
}

.create-proposal-modal-bottom {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-content: center;
}
</style>