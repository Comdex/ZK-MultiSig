<template>
    <div class="main">
        <div class="header">
            <div class="title">
                <NuxtLink to="/" style="color: gray; text-decoration:none">
                    MultiSig Wallet
                </NuxtLink>


                <n-tag type="info" style="margin-left: 10px">
                    Berkley TestNet
                </n-tag>

            </div>

            <div class="header-right">
                <n-button type="info" style="margin-right: 20px;" ghost @click="showGenKey">
                    Generate Keys
                </n-button>

                <n-button v-if="zkappState.signerPublicKey58 == null" @click="showConnectWallet">
                    Connect Wallet
                </n-button>
                <div v-else>
                    <n-tag type="info" class="signer" @click="copySignerPublicKey58">
                        signer:{{ sliceAddress(zkappState.signerPublicKey58) }}
                        <template v-if="zkappState.signerBalance != null">({{ zkappState.signerBalance }}
                            mina)</template>
                    </n-tag>


                    <n-button @click="disconnectWallet">Disconnect</n-button>
                </div>

            </div>
        </div>

        <div class="content">
            <slot />
        </div>


        <div class="footer">
            <div v-if="zkappState.walletPublicKey58 == null" class="desc">
                {{ APP_URL }}
            </div>

            <div v-else class="wallet-desc">
                <div class="wallet">
                    <n-tag v-if="zkappState.walletPublicKey58 != null" @click="copyWalletPublicKey58" :bordered="false"
                        type="success" size="large" round style="margin-right: 12px">
                        Wallet: {{ sliceAddress(zkappState.walletPublicKey58) }}
                        <template v-if="zkappState.walletName != null">({{ zkappState.walletName }})</template>
                    </n-tag>

                    <n-tag v-if="zkappState.walletBalance != null" :bordered="false" type="success" size="large" round
                        style="margin-right: 12px">
                        Balance: {{ zkappState.walletBalance }} mina
                    </n-tag>

                    <n-tag v-if="zkappState.walletNonce != null" :bordered="false" type="success" size="large" round
                        style="margin-right: 12px">
                        Nonce: {{ zkappState.walletNonce }}
                    </n-tag>

                    <n-tag v-if="zkappState.approverThreshold != null" :bordered="false" type="success" size="large"
                        round>
                        Threshold: {{ zkappState.approverThreshold }}
                    </n-tag>
                </div>

                <div class="website">
                    <NuxtLink to="/" style="color: gray; text-decoration:none">
                        {{ APP_URL }}
                    </NuxtLink>

                </div>
            </div>

        </div>


        <!--connect wallet modal-->
        <n-modal v-model:show="showConnectWalletModal" preset="card" :style="connectBodyStyle" title="Connect Wallet"
            size="huge" :bordered="false" :segmented="connectSegmented" :mask-closable="false" :close-on-esc="false">

            <div class="statement">
                Note: Since the browser wallet of the community has not yet supported the signature of the Berkeley
                Testnet
                , and its signature is still not verifiable in the circuit, so temporarily use the method of
                importing the private key to perform operations such as signing.

                <div style="margin-top: 5px">
                    keys for test:
                    EKEXKuzh365e3pWDAQAWMR1wuFnmtLn1oC3g1bMN2XBw7hB7ksX6
                    EKENSaxTrnJ9CH336EnXeJVqv3vPWhmUCQgie1MdTC29wM28bnec
                    EKF76fJsTc5JBeLBrWxGAwGhSvochWyhJBwWqFTro9Dqyai5J1bn
                </div>

            </div>
            <n-form label-placement="top" label-width="auto" require-mark-placement="right-hanging" size="medium">
                <n-form-item label="Mina Private Key" path="privateKey">
                    <n-input v-model:value="signerPrivateKey58" placeholder="Input Mina PrivateKey" />
                </n-form-item>
            </n-form>

            <template #footer>
                <n-button type="info" ghost @click="importPriKey">
                    Import
                </n-button>

            </template>
        </n-modal>


        <!--show gen keys modal-->
        <n-modal v-model:show="showGenKeyModal" preset="card" @on-after-leave="genKeysClose" :style="connectBodyStyle"
            title="Generate Mina Keys" size="huge" :bordered="false" :segmented="connectSegmented"
            :mask-closable="false" :close-on-esc="false">

            <div>
                Public Key(Address):
            </div>
            <div v-if="pubKey != null">
                {{ pubKey }}
            </div>
            <div v-else>
                ungenerated
            </div>

            <n-divider />

            <div>
                Private Key:
            </div>

            <div v-if="priKey != null">
                {{ priKey }}
            </div>
            <div v-else>
                ungenerated
            </div>
            <n-divider />

            <NuxtLink to="https://faucet.minaprotocol.com" target="_blank">Testnet Faucet
            </NuxtLink>

            <template #footer>
                <n-button type="info" ghost @click="genKeys">
                    Genereate
                </n-button>

            </template>
        </n-modal>

    </div>
</template>

<script setup lang="ts">
import { PrivateKey, PublicKey } from 'snarkyjs';
import { WalletConfJSON } from '../common/types';
import { STORAGE_KEY_SIGNER_PRIVATEKEY, STORAGE_KEY_WALLET_CONF, APP_URL } from '../common/constant';
import { useDialog } from 'naive-ui';

const { sliceAddress, message } = useUtils();
const { zkappState, currentWalletAddress, loadSnarkyJS, loadContract,
    setActiveInstanceToBerkeley, refreshWalletState, refreshSignerState,
    initZkappInstance } = useZkapp();
const dialog = useDialog();

const connectBodyStyle = {
    'width': '600px',
};
const connectSegmented = {
    content: 'soft',
    footer: 'soft'
};
const showConnectWalletModal = ref<boolean>(false);
const signerPrivateKey58 = ref<string | null>(null);
const showConnectWallet = () => {
    signerPrivateKey58.value = null;
    showConnectWalletModal.value = true;
};
const showGenKeyModal = ref<boolean>(false);
const showGenKey = () => {
    showGenKeyModal.value = true;
};

const pubKey = ref<string | null>(null);
const priKey = ref<string | null>(null);
const genKeys = () => {
    const privateKey = PrivateKey.random();
    pubKey.value = privateKey.toPublicKey().toBase58();
    priKey.value = privateKey.toBase58();
};

const setSignerKey = (signerPrivateKey58Str: string) => {
    try {
        const priKey = PrivateKey.fromBase58(signerPrivateKey58Str.trim());
        const pubKey = priKey.toPublicKey();
        zkappState.value.signerPrivateKey = priKey;
        zkappState.value.signerPublicKey = pubKey;
        zkappState.value.signerPublicKey58 = pubKey.toBase58();

        window.localStorage.setItem(STORAGE_KEY_SIGNER_PRIVATEKEY, signerPrivateKey58Str);
    } catch (err) {
        message.error('The private key is invalid');
    }
};

const importPriKey = async () => {
    if (signerPrivateKey58.value == null) {
        message.error("Please input the mina private key you want to connect");
        return;
    }

    setSignerKey(signerPrivateKey58.value.trim());
    signerPrivateKey58.value = null;
    showConnectWalletModal.value = false;
    message.info("Connect wallet success");

    await refreshSignerState();
};


const disconnectWallet = () => {
    zkappState.value.signerPublicKey = null;
    zkappState.value.signerPublicKey58 = null;
    window.localStorage.removeItem(STORAGE_KEY_SIGNER_PRIVATEKEY);
    message.info("Disconnect wallet success");
}

const copySignerPublicKey58 = async () => {
    try {
        let value = zkappState.value.signerPublicKey58;
        if (value != null) {
            await navigator.clipboard.writeText(value);
            message.info("Signer address has been copied to the clipboard");
        }

    } catch (err) {
        message.error("copy failed");
    }
};

const copyWalletPublicKey58 = async () => {
    try {
        let value = zkappState.value.walletPublicKey58;
        if (value != null) {
            await navigator.clipboard.writeText(value);
            message.info("MultiWallet address has been copied to the clipboard");
        }

    } catch (err) {
        message.error("copy failed");
    }
};

onMounted(async () => {
    console.log("layout onMounted");
    if (!zkappState.value.hasBeenSetup) {
        await loadSnarkyJS();
        setActiveInstanceToBerkeley();
        await loadContract();
    }

    const signerPrivateKeyStr = window.localStorage.getItem(STORAGE_KEY_SIGNER_PRIVATEKEY);
    if (signerPrivateKeyStr) {
        console.log("Read signer key from localStorage");
        setSignerKey(signerPrivateKeyStr);
    }

    const walletConfStr = window.localStorage.getItem(STORAGE_KEY_WALLET_CONF);
    if (walletConfStr != null) {
        try {
            const wc: WalletConfJSON = JSON.parse(walletConfStr);
            console.log("wallet config: ", wc);

            zkappState.value.walletName = wc.walletName;
            zkappState.value.walletPublicKey58 = wc.walletAddress;
            currentWalletAddress.value = wc.walletAddress;
            zkappState.value.approvers = wc.owners;
            zkappState.value.walletPublicKey = PublicKey.fromBase58(wc.walletAddress);

            initZkappInstance(wc.walletAddress);

            await refreshWalletState();
            await refreshSignerState();

            console.log("load local wallet config done");
        } catch (err) {
            console.error(err);
        }

    }

    // if (!zkappState.value.hasBeenSetup) {
    //     zkappState.value.zkappWorkerClient = new ZkappWorkerClient();

    //     console.log("Loading SnarkyJS...");
    //     await zkappState.value.zkappWorkerClient.loadSnarkyJS();
    //     console.log("Loading done");

    //     await zkappState.value.zkappWorkerClient.setActiveInstanceToBerkeley();
    //     console.log("SetActiveInstanceToBerkeley done");

    //     await zkappState.value.zkappWorkerClient.loadContract();

    //     setTimeout(async () => {
    //         console.log('compiling zkApp');
    //         await zkappState.value.zkappWorkerClient?.compileContract();
    //         console.log('zkApp compiled');
    //     }, 10000);


    //     zkappState.value.hasBeenSetup = true;
    // }
});
</script>


<style scoped lang="scss">
.main {
    background-color: #f9fbfc;
    padding-bottom: 24px;
    min-height: calc(100vh - 24px);
    display: flex;
    flex-direction: column;
}

.statement {
    color: red;
    margin-bottom: 15px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-content: center;
    background: #fff;

    margin-left: 15px;
    margin-right: 15px;
    padding: 15px;
    border-radius: 10px;

    border-width: 1px;
    border-style: dotted;
    margin-top: 10px;

    .title {
        display: flex;
        justify-content: space-around;
        align-content: center;
        font-size: 18px;
        font-weight: bold;
    }

    .header-right {
        display: flex;
    }

    .signer {
        font-size: 15px;
        font-weight: bold;
        margin-right: 12px;
    }
}

.content {
    display: flex;
    flex-direction: column;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 10px;
    background: #fff;

    padding-left: 15px;
    padding-right: 15px;
    padding-top: 8px;
    border-width: 1px;
    border-color: gray;
    border-style: dashed;
}

.footer {
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;
    align-items: center;
    align-content: center;
    background: #fff;

    margin-left: 15px;
    margin-right: 15px;
    padding: 15px;
    border-radius: 10px;

    border-width: 1px;
    border-style: dotted;
    margin-top: 10px;

    .wallet-desc {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        width: 100%;

        .wallet {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            align-content: center;
        }

        .website {
            display: flex;
            flex-wrap: nowrap;
            flex-direction: row-reverse;
            align-items: center;
            align-content: center;
            margin-right: 15px;
            font-size: 18px;
            font-weight: bold;
            color: gray;
        }
    }

    .desc {
        display: flex;
        justify-content: center;
        width: 100%;
        align-items: center;
        align-content: center;
        font-size: 18px;
        font-weight: bold;
        color: gray;
    }
}
</style>