<template>

    <!-- <div class="show-proposal">

        <div class="item">
            <div class="left">Title:</div>
            <div class="right">Fund the contract</div>
        </div>

        <div class="item">
            <div class="left">Amount(mina):</div>
            <div class="right">2.15</div>
        </div>

        <div class="item">
            <div class="left">Receiver:</div>
            <div class="right">B62qm1uQcaZ9Ck8qXuNt46u3K5SQrZ8x7dDfurUFv4VuV8HVMBv6g6r</div>
        </div>

    </div> -->
    <div class="show-proposal">
        <div class="title">
            Proposal
        </div>

        <n-form label-placement="left" label-width="auto" label-align="right" :style="{
            'border-width': '1px',
            'border-style': 'dashed',
            'padding': '40px',
            'border-radius': '5px',
            'margin-top': '20px',
            'margin-bottom': '20px',
            //'background-color': 'rgba(32, 128, 240, 0.1)',
            'background-color': '#f9fbfc',
            'color': '#2080f0',
        }">
            <n-form-item label="Contract Wallet:">
                {{ zkappState.walletPublicKey58 }}
            </n-form-item>

            <n-form-item label="Contract Nonce:">
                {{ zkappState.walletNonce }}
            </n-form-item>

            <n-form-item label="Desc:">
                {{ proposal?.desc }}
            </n-form-item>

            <n-form-item label="Amount(mina):">
                {{ proposal?.amount }}
            </n-form-item>

            <n-form-item label="Receiver:">
                {{ proposal?.receiver }}
            </n-form-item>

            <n-form-item label="Signatures Signed:">
                {{ proposal?.signedNum }}
            </n-form-item>

            <n-form-item label="Meet Approver Threshold:">
                {{ meetThreshold }}
            </n-form-item>
        </n-form>

        <div class="operate">
            <n-button type="info" :disabled="addSignBtnDisabled" style="margin-right: 5px" ghost @click="addSign">
                Sign Proposal
            </n-button>

            <n-button type="info" style="margin-right: 5px" ghost :disabled="sendBtnDisabled" @click="sendProposal">
                Send To Network
            </n-button>
        </div>
    </div>


</template>

<script setup lang="ts">
import { useDialog } from 'naive-ui';
import { PublicKey, Signature } from 'snarkyjs';
import type { Proposal, ProposalSign } from '../../common/types';
const route = useRoute();
const { zkappState, getProposalFields, createProposal,
    createProposalWithSigns, sendAssets, refreshWalletState, refreshSignerState } = useZkapp();
const { createLoading, removeLoading, message } = useUtils();
const dialog = useDialog();

const proposalId = route.params.id;
console.log("route proposalId: ", proposalId);

const addSignBtnDisabled = ref<boolean>(false);
const sendBtnDisabled = ref<boolean>(false);

const proposal = ref<Proposal | null>(null);
const signs = ref<ProposalSign[] | null>(null);

onMounted(async () => {
    const { data: res, refresh: proposalListRefresh } = await useFetch('/api/getProposalDetail', {
        method: 'GET', params: { proposalId }, pick: ['data']
    });

    proposal.value = res.value?.data?.proposal as unknown as Proposal;
    signs.value = res.value?.data?.signs as ProposalSign[];
    refreshWalletState();
    refreshSignerState();
});



const meetThreshold = computed(() => {
    if (proposal.value?.signedNum! >= zkappState.value.approverThreshold!) {
        return "Yes";
    }

    return "No";
});

const sendProposal = async () => {
    if (zkappState.value.signerPrivateKey == null) {
        message.error("Please connect signer wallet first");
        return;
    }
    if (proposal.value?.signedNum! < zkappState.value.approverThreshold!) {
        message.error("The number of signatures has not yet met the threshold");
        return;
    }
    if (Number(zkappState.value.signerBalance) < 0.3) {
        message.error("The connected signer wallet does not have enough balance to pay the transaction fee");
        return;
    }
    sendBtnDisabled.value = true;
    createLoading();

    if (!zkappState.value.hasBeenCompiled) {
        message.error(`Please click the "Compile Contract" button on the main page before proceeding`);
        sendBtnDisabled.value = false;
        removeLoading();
        return;
    }

    await refreshWalletState();
    if (Number(zkappState.value.walletBalance) < proposal.value?.amount!) {
        message.error('Insufficient balance in multi-sig wallet');
        sendBtnDisabled.value = false;
        removeLoading();
        return;
    }

    const p = await createProposal({
        contractAddress: zkappState.value.walletPublicKey58!,
        contractNonce: zkappState.value.walletNonce!, desc: proposal.value?.desc!,
        amount: proposal.value?.amount! + '', receiver: proposal.value?.receiver!
    });

    const approvers = signs.value?.map((s) => PublicKey.fromBase58(s.publicKey58));
    const signatrues = signs.value?.map((s) => Signature.fromJSON(JSON.parse(s.sign)));
    const ps = await createProposalWithSigns({ proposal: p, approvers: approvers!, signs: signatrues! });
    try {
        const hash = await sendAssets(ps);
        dialog.success({
            title: 'Success',
            maskClosable: false,
            closeOnEsc: false,
            content: `
Propsal transaction sent.

Your wallet state will be updated
as soon as the transaction is included in a block:
https://berkeley.minaexplorer.com/transaction/${hash}
`,
        });
    } catch (err) {
        console.error(err);
        message.error("An error occurred while submitting the transaction to the network: " + err);
    }

    removeLoading();
    sendBtnDisabled.value = false;
};

const addSign = async () => {
    if (zkappState.value.signerPrivateKey == null) {
        message.error("Please connect signer wallet first");
        return;
    }

    addSignBtnDisabled.value = true;
    createLoading();

    const approverHashes = zkappState.value.approverHashes;
    const isApprover = approverHashes!.isApprover(zkappState.value.signerPublicKey!);
    if (!isApprover) {
        addSignBtnDisabled.value = false;
        removeLoading();
        message.error("The current signer wallet is not one of the owners of current multisig wallet");
        return;
    }

    const { data: re } = await useFetch('/api/isSigned', {
        method: 'GET', params: { proposalId: proposal.value?.id, publicKey58: zkappState.value.signerPublicKey58 }, pick: ['data']
    });
    if ((re.value as any).data.isSigned) {
        addSignBtnDisabled.value = false;
        removeLoading();
        message.error("The current siger has signed the proposal");
        return;
    }

    const fs = await getProposalFields({
        contractAddress: zkappState.value.walletPublicKey58!,
        contractNonce: zkappState.value.walletNonce!, desc: proposal.value?.desc!,
        amount: proposal.value?.amount! + '', receiver: proposal.value?.receiver!
    });

    const s: { proposalId: string; publicKey58: string; sign: string } = {
        proposalId: proposalId as string,
        publicKey58: zkappState.value.signerPublicKey58 as string,
        sign: JSON.stringify(Signature.create(zkappState.value.signerPrivateKey!, fs).toJSON())
    };
    console.log("sign: ", s);

    const { data: res } = await useFetch('/api/addSign', {
        method: 'POST', body: s
    });

    console.log("create proposal res: ", res.value);

    addSignBtnDisabled.value = false;
    if (res.value === "success") {
        proposal.value = {
            ...proposal.value,
            signedNum: proposal.value?.signedNum! + 1
        } as Proposal;
        message.success("Add signatrue success");
        removeLoading();
    } else {
        message.error("Add signature failed");
        removeLoading();
    }
};

</script>

<style scoped lang="scss">
.show-proposal {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    align-content: center;
    padding-top: 10px;
    padding-bottom: 20px;

    .title {
        font-size: 27px;
        font-style: bold;
    }

    .operate {
        display: flex;
        justify-content: space-between;
    }

    // .item {
    //     display: flex;
    //     flex-wrap: nowrap;
    //     justify-content: space-between;
    //     align-items: center;
    //     align-content: center;
    //     font-size: 20px;
    //     margin-bottom: 10px;

    //     .left {
    //         font-weight: bold;
    //         padding-right: 60px;
    //     }

    //     .right {}
    // }
}
</style>