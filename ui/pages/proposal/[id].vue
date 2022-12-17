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
            'maxWidth': '640px',
            'border-width': '1px',
            'border-color': 'green',
            'border-style': 'dashed',
            'padding-left': '40px',
            'padding-right': '40px',
            'border-radius': '5px',
            'margin-top': '20px',
            'margin-bottom': '20px',
        }">
            <n-form-item label="Contract Wallet:">
                {{ zkappState.walletPublicKey58 }}
            </n-form-item>

            <n-form-item label="Contract Nonce:">
                {{ zkappState.walletNonce }}
            </n-form-item>

            <n-form-item label="Desc:">
                {{ proposal?.data!.desc }}
            </n-form-item>

            <n-form-item label="Amount(mina):">
                {{ proposal?.data!.amount }}
            </n-form-item>

            <n-form-item label="Receiver:">
                {{ proposal?.data!.receiver }}
            </n-form-item>

            <n-form-item label="Signatures Signed:">
                {{ proposal?.data!.signedNum }}
            </n-form-item>

            <n-form-item label="Meet Approver Threshold:">
                {{ meetThreshold }}
            </n-form-item>
        </n-form>

        <div class="operate">
            <n-button type="info" :disabled="addSignBtnDisabled" style="margin-right: 5px" ghost @click="addSign">
                Sign Proposal
            </n-button>

            <n-button type="info" style="margin-right: 5px" ghost disabled>
                Send To Network
            </n-button>
        </div>
    </div>


</template>

<script setup lang="ts">
import { MessageReactive, useMessage } from 'naive-ui';
import { Field, Signature } from 'snarkyjs';
const route = useRoute();
const { zkappState, getProposalFields } = useZkapp();


const proposalId = route.params.id;
console.log("route proposalId: ", proposalId);

const message = useMessage();
let messageReactive: MessageReactive | null = null;
const removeLoading = () => {
    setTimeout(() => {
        if (messageReactive) {
            messageReactive.destroy();
            messageReactive = null;
        }
    }, 3000);
};
const createLoading = (msg?: string) => {
    if (!messageReactive) {
        if (msg) {
            messageReactive = message.loading(msg, {
                duration: 0
            });
        } else {
            messageReactive = message.loading("Please wait", {
                duration: 0
            });
        }

    }
};

const addSignBtnDisabled = ref<boolean>(false);
type Proposal = {
    id: number;
    desc: string;
    amount: number;
    receiver: string;
    contractAddress: string;
    contractNonce: number;
    signedNum: number;
};
const { data: proposal, refresh: proposalListRefresh } = await useFetch('/api/getProposalDetail', {
    method: 'GET', params: { proposalId }, pick: ['data']
});

const meetThreshold = computed(() => {
    if (proposal.value?.data?.signedNum! > zkappState.value.approverThreshold!) {
        return "Yes";
    }

    return "No";
});

const addSign = async () => {
    addSignBtnDisabled.value = true;
    createLoading();
    const fs = getProposalFields({
        contractAddress: "B62qoGsRCnmLD5MQcyUagUUrpQtBQ5e75ZhHAwVzdbkMH5ZuZM3YM2Y",
        contractNonce: 2, desc: proposal.value?.data?.desc!,
        amount: proposal.value?.data?.amount!, receiver: proposal.value?.data?.receiver!
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
        message.success("Add signatrue success");
        removeLoading();
    } else {
        message.error("Add signature failed");
        removeLoading();
    }
    proposalListRefresh();
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