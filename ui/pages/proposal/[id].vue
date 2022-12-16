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
            <n-form-item label="Desc:">
                Fund the contract
            </n-form-item>

            <n-form-item label="Amount(mina):">
                2.75
            </n-form-item>

            <n-form-item label="Receiver:">
                B62qm1uQcaZ9Ck8qXuNt46u3K5SQrZ8x7dDfurUFv4VuV8HVMBv6g6r
            </n-form-item>

            <n-form-item label="Contract Wallet:">
                B62qm1uQcaZ9Ck8qXuNt46u3K5SQrZ8x7dDfurUFv4VuV8HVMBv6g6r
            </n-form-item>

            <n-form-item label="Contract Nonce:">
                1
            </n-form-item>

            <n-form-item label="Signatures Signed:">
                1
            </n-form-item>

            <n-form-item label="Meet Approver Threshold:">
                No
            </n-form-item>
        </n-form>

        <div class="operate">
            <n-button type="info" style="margin-right: 5px" ghost>
                Sign Proposal
            </n-button>

            <n-button type="info" style="margin-right: 5px" ghost disabled>
                Send To Network
            </n-button>
        </div>
    </div>


</template>

<script setup lang="ts">
const route = useRoute();
const proposalId = route.params.id;
console.log("proposalId: ", proposalId);

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