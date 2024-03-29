<template>
  <section>
    <div class="container heading my-6">
      <div class="columns">
        <div class="column is-full is-family-code has-text-center">
          <h1 class="poolHeading is-size-1 has-text-weight-thin ma-3">
            {{ poolDetails.name || null }}
          </h1>
          <p class="poolHeading has-text-grey">{{ poolDetails.desc || null }}</p>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="columns">
        <div class="column imageHolder is-three-quarters p-1 mx-2">
          <img class="image" :src="poolDetails.image"></img>
        </div>
        <div class="column px-1 mx-2 is-one-quarter">
          <div class="column is-full">
            <b-progress
              type="is-success"
              :value="(poolDetails.valueInEth / poolDetails.totalPrice) * 100"
              show-value
              format="percent"
            ></b-progress>
          </div>
          <div class="column pb-0 is-full">
            <h1 class="has-text-weight-light is-size-3"><strong>Ξ{{ poolDetails.valueInEth }}</strong> $({{Number(poolDetails.valueInUsd).toFixed(2)}})</h1>
          </div>
          <div class="column pt-0 is-full">
            <h1> pooled of <strong>Ξ{{ poolDetails.totalPrice }}</strong> $({{Number(poolDetails.totalPriceInUsd).toFixed(2)}}) goal</h1>
          </div>
          <div class="column is-full pb-0">
            <h1 class="is-size-3"><strong>{{ poolDetails.backers }}</strong></h1>
          </div>
          <div class="column is-full pt-0">
            <h1>Contributors</h1>
          </div>
          <div v-if='poolDetails.status != "Closed"' class="column is-full">
            <!-- <h1>{{ poolDetails.deadline }} days to go</h1> -->
            <div v-if="clockDeadline() != null">
              <flip-countdown :deadline="clockDeadline()" @timeElapsed="getData"></flip-countdown>
            </div>
          </div>
          <div v-if='poolDetails.status != "Closed"' class="column mt-6 is-full">
            <b-input v-model='contribution' type='number' step="any" placeholder="Contribution in Ξ"></b-input>
            <b-button :loading="contributionLoading" @click.native="contribute">Add to Pool</b-button>
          </div>
          <div class="column is-full">
            <h1 class="has-text-weight-light">You've added Ξ{{ poolDetails.poolInvestment }} to this pool</h1>
          </div>
          <div v-if='poolDetails.status == "Closed"' class="column mt-6 is-full">
            <h2 class="has-text-weight-bold is-size-2">Pool Closed</h2>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="columns">
        <div class="column auto px-3 my-3">
          <p>Created by {{ this.poolDetails.owner }}</p>
        </div>
        <div class="column auto px-3 my-3">
          <p>Pool Boost Rate {{ poolAPY }}%</p>
        </div>
      </div>
    </div>
    <br>
    <div class="container">
      <h1 class="is-size-1">Shards Details</h1>
      <div class="columns">
        <div class="column auto px-3 my-3"> 
          <h1>Fractional Token Address: {{poolDetails.ERC20Token}}</h1>    
          <b-table
            :data="erc20Events"
            :default-sort="['ownership', 'desc']"
            :columns="columns"
            default-sort-direction="desc"
          />
        </div>
      </div>
    </div>
    <div class="container">
      <div class="columns">
        <div class="column auto px-3 my-3"> 
          <h1>Owner Settings</h1>    
            <b-button :loading="mintingLoading" @click.native="mintAndShard">Mint and Shard</b-button>
            <!-- <b-button @click.native="close">Close</b-button>      -->
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import fundPoolABI from '~/contracts/ABI/NFTShardPoolP.json'
import fractionalTokenABI from '~/contracts/ABI/NFTShardERC20.json'

import { KOVAN_NFTSHARDFACTORY } from '~/constants'
import { mapState } from 'vuex'
import FlipCountdown from 'vue2-flip-countdown'

export default {
  async asyncData(context) {
    console.log(context.params.id)

    return {
      address: context.params.id,
    }
  },
  computed: {
    ...mapState(['selectedAccount']),
  },
  components: {
    FlipCountdown,
  },
  watch: {
    poolDetails() {},
  },
  data() {
    return {
      id: '',
      fundPool: null,
      poolAPY: 4000000,
      balance: 0,
      contribution: null,
      latestBlock: {},
      events: [],
      contributionLoading: false,
      mintingLoading: false,
      erc20Events: [],
      columns: [
        {
          field: 'contributor',
          label: 'Contributor',
        },
        {
          field: 'ownership',
          label: 'Ownership',
          numeric: true,
        },
      ],
      poolDetails: {
        backers: 0,
        valueInEth: 0,
        valueInUsd: 0,
      },
    }
  },
  async mounted() {
    if (this.$web3Modal.cachedProvider) {
      await this.$store.dispatch('connectToWallet')
    }
    this.fundPool = await new this.$web3.eth.Contract(
      fundPoolABI.abi,
      this.address
    )
    console.log('contract', this.fundPool)

    this.getData()
    setInterval(() => {
      if (this.poolDetails.status != 'Closed') {
        this.poolDetails.valueInEth = (
          Number(this.poolDetails.valueInEth) +
          (Number(this.poolDetails.valueInEth) * (Number(this.poolAPY) / 100)) /
            365 /
            24 /
            60 /
            60
        ).toFixed(4)
        this.poolDetails.valueInUsd = (
          Number(this.poolDetails.valueInUsd) +
          (Number(this.poolDetails.valueInUsd) * (Number(this.poolAPY) / 100)) /
            365 /
            24 /
            60 /
            60
        ).toFixed(2)
      }
    }, 1000)
  },
  methods: {
    truncateAddress(address) {
      if (address.length > 0) {
        return (
          address.substring(0, 4) +
          '....' +
          address.substring(address.length - 5, address.length)
        )
      } else {
        return address
      }
    },
    clockDeadline() {
      console.log('DUE DATE', this.poolDetails.dueDate)
      return this.timeConverter(this.poolDetails.dueDate)
    },
    contribute() {
      this.contributionLoading = true
      this.fundPool.methods
        .buyShards()
        .send({
          from: this.selectedAccount,
          value: this.$web3.utils.toWei(this.contribution),
        })
        .then((res) => {
          console.log(res)
          this.contribution = ''
          this.contributionLoading = false
          this.$buefy.toast.open({
            duration: 5000,
            message: `Your contribution has been made!`,
            position: 'is-top',
            type: 'is-success',
          })
          this.getData()
        })
        .catch((err) => {
          console.log(err)
          this.contribution = ''
          this.contributionLoading = false
        })
    },
    close() {
      this.fundPool.methods
        .closePool()
        .send({ from: this.selectedAccount })
        .then((res) => {
          console.log(res)
        })
        .catch((err) => {
          console.log(err)
        })
    },
    timeConverter(UNIX_timestamp) {
      function _addZeroBefore(n) {
        return (n < 10 ? '0' : '') + n
      }
      if (UNIX_timestamp == null) {
        return
      }
      var a = new Date(UNIX_timestamp * 1000)
      var year = a.getFullYear()
      var month = _addZeroBefore(a.getMonth() + 1)
      var date = _addZeroBefore(a.getDate())
      var hour = _addZeroBefore(a.getHours())
      var min = _addZeroBefore(a.getMinutes())
      var sec = _addZeroBefore(a.getSeconds())
      var time =
        year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec
      console.log(time)
      return time
    },
    async getData() {
      console.log('getting data')
      this.balance = this.$web3.utils.fromWei(
        await this.$web3.eth.getBalance(this.address)
      )
      this.latestBlock = await this.$web3.eth.getBlock('latest')

      await this.fundPool.methods
        .pool()
        .call()
        .then(async (res) => {
          console.log('res', res)
          const JSONMetadata = await this.$axios
            .get(res.nftURI.replaceAll('ipfs://', 'https://ipfs.io/ipfs/'))
            .then((result) => {
              this.poolDetails.image = result.data.image.replaceAll(
                'ipfs://',
                'https://ipfs.io/ipfs/'
              )
              this.poolDetails.name = result.data.name
              this.poolDetails.desc = result.data.description
            })
          this.poolDetails.startTime = res.startTime
          this.poolDetails.ERC20Token = res.ERC20Token
          this.poolDetails.deadline = (res.deadline / 86400).toFixed(0)
          this.poolDetails.owner = res.owner
          this.poolDetails.totalPrice = this.$web3.utils.fromWei(res.totalPrice)
          this.poolDetails.totalPriceInUsd = this.$web3.utils.fromWei(
            res.totalPriceInUSD
          )
          this.poolDetails.status = res.status
          this.poolDetails.valueInEth = this.$web3.utils.fromWei(
            res.soldShardsValueInETH
          )
          this.poolDetails.valueInUsd = this.$web3.utils.fromWei(
            res.soldShardsValueInUSD
          )

          this.poolDetails.timeRemaining =
            Number(res.startTime) +
            Number(res.deadline) -
            this.latestBlock.timestamp
          this.poolDetails.dueDate =
            Number(res.startTime) + Number(res.deadline)
          if (this.poolDetails.timeRemaining < 0) {
            this.poolDetails.status = 'Closed'
          }
          this.$forceUpdate()
        })
      console.log(this.fundPool)

      await this.fundPool.methods
        .buyers(this.selectedAccount)
        .call()
        .then((result) => {
          this.poolDetails.poolInvestment = Number(
            this.$web3.utils.fromWei(result)
          ).toFixed(8)
        })

      await this.fundPool.methods
        .getBuyersCount()
        .call()
        .then((result) => {
          this.poolDetails.backers = result
        })
      await this.fundPool
        .getPastEvents('allEvents')
        .then((events) => {
          console.log(events)
          this.events = events
        })
        .catch((error) => {
          console.log(error)
        })

      this.fractionalToken = await new this.$web3.eth.Contract(
        fractionalTokenABI.abi,
        this.poolDetails.ERC20Token
      )
      console.log(this.fractionalToken)
      this.erc20Events = []
      await this.fractionalToken
        .getPastEvents(
          'Transfer',
          {
            filter: {}, // Using an array means OR: e.g. 20 or 23
            fromBlock: 0,
            toBlock: 'latest',
          },
          function (error, events) {
            return events
          }
        )
        .then((events) => {
          console.log('Events', events)
          events.map((tx) => {
            this.erc20Events.push({
              contributor:
                tx.returnValues.to == this.address
                  ? 'Pool Creation'
                  : tx.returnValues.to,
              ownership: this.$web3.utils.fromWei(tx.returnValues.value),
            })
          })
        })
        .catch((err) => {
          console.log(err)
        })
    },
    async mintAndShard() {
      this.mintingLoading = true;
      var timestamp = await this.$web3.eth.getBlock('latest')
      console.log(timestamp)
      this.fundPool.methods
        .mintNFTandShard()
        .send({ from: this.selectedAccount })
        .then((res) => {
          console.log(res)
          this.getData()
          this.mintingLoading = false;
          this.getData()

        })
        .catch((err) => {
          console.log(err)
          this.mintingLoading = false;
          this.getData()
        })
    },
  },
}
</script>
<style>
.imageHolder {
  display: flex;
  justify-content: center;
  padding: 2rem;
}
.poolHeading {
  text-align: center;
}
.image {
  max-height: 500px;
}
.pb-0 {
  padding-bottom: 0;
}
.pt-0 {
  padding-top: 0;
}
</style>
