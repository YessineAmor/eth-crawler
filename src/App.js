import 'semantic-ui-css/semantic.min.css'
import axios from "axios";
import { useState } from 'react';
import { Accordion, Button, Container, Form, Icon, Label, Menu, Table } from 'semantic-ui-react'





function App() {
  const [addressToWatch, setAddressToWatch] = useState();
  const [startingBlockNumber, setStartingBlockNumber] = useState();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canDisplay, setCanDisplay] = useState(false);
  const [currentBlock, setCurrentBlock] = useState();
  const [latestBlock, setLatestBlock] = useState();
  const [date, setDate] = useState();
  async function getTransactions({ addressToWatch, startingBlockNumber }) {
    addressToWatch = addressToWatch.toLowerCase();
    const url = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`;
    try {
      let addressTransactions = [];
      let latestBlockNumber = await axios.post(url, { "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 83 });
      latestBlockNumber = parseInt(latestBlockNumber.data.result, 16);
      setLatestBlock(latestBlockNumber);
      console.log('latest block number = ', latestBlockNumber);
      for (let i = startingBlockNumber; i <= latestBlockNumber; i++) {
        setCurrentBlock(i);
        console.log('current block number = ', i);
        let currentBlockNumberHex = parseInt(i).toString(16);
        console.log('currentBlockNumberHex = ', currentBlockNumberHex);
        let body = {
          "id": 0,
          "jsonrpc": "2.0",
          "method": "eth_getBlockByNumber",
          "params": [
            "0x" + currentBlockNumberHex,
            true
          ]
        }
        let txs = await axios.post(url, body);
        console.log("TXS = ", txs);
        txs = txs.data.result.transactions;
        txs.forEach(txn => {
          if (txn.to === addressToWatch || txn.from === addressToWatch) {
            addressTransactions.push(txn);
          }
        });
      }
      return addressTransactions;

    } catch (error) {
      alert(error);
    }
  }
  const handleSubmit = async () => {
    setIsLoading(true);
    const txs = await getTransactions({ addressToWatch, startingBlockNumber });
    setTransactions(txs);
    setIsLoading(false);
    if (txs.length > 0) {
      setCanDisplay(true);
    } else {
      alert('no results found');
    }
  }

  const TableExamplePagination = (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Txn Hash</Table.HeaderCell>
          <Table.HeaderCell>Block</Table.HeaderCell>
          <Table.HeaderCell>From</Table.HeaderCell>
          <Table.HeaderCell>To</Table.HeaderCell>
          <Table.HeaderCell>Value</Table.HeaderCell>
          <Table.HeaderCell>Gas</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {transactions.map(tx => {

          return (<Table.Row>
            <Table.Cell>{tx.hash}</Table.Cell>
            <Table.Cell>{parseInt(tx.blockNumber, 16)}</Table.Cell>
            {addressToWatch.toLowerCase() === tx.from ? <><Table.Cell style={{ backgroundColor: 'green' }}>{tx.from}</Table.Cell><Table.Cell>{tx.to}</Table.Cell> </> : <><Table.Cell >{tx.from}</Table.Cell><Table.Cell style={{ backgroundColor: 'green' }}>{tx.to}</Table.Cell> </>}
            <Table.Cell>{parseInt(tx.value, 16)} Wei</Table.Cell>
            <Table.Cell>{parseInt(tx.gas, 16)} Wei</Table.Cell>
          </Table.Row>);
        })}
      </Table.Body>


    </Table>
  )
  const [activeIndex, setActiveIndex] = useState();
  const [balanceAtDate, setBalanceAtDate] = useState(0);
  const [canDisplayDate, setCanDisplayDate] = useState(false);
  const handleClick = (e, titleProps) => {
    const { index } = titleProps
    const newIndex = activeIndex === index ? -1 : index
    setActiveIndex(newIndex);
  }
  const [dateAddress, setDateAddress] = useState()
  const getBalance = async (dateAddress, blockNumber) => {
    const url = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`;
    const body = { "id": 1, "jsonrpc": "2.0", "method": "eth_getBalance", "params": [dateAddress, "0x" + parseInt(blockNumber).toString(16)] };
    let response = await axios.post(url, body);
    console.log('AAAA = ', response.data.result);
    setBalanceAtDate(response.data.result);
    setCanDisplayDate(true);
  }

  const handleDateSubmit = async () => {
    setDateIsLoading(true);
    const timestamp = Math.floor(new Date(date).getTime() / 1000);
    const url = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before`;
    let response = await axios.get(url);
    const blockNumber = response.data.result;
    console.log(blockNumber);
    getBalance(dateAddress, blockNumber);
    setDateIsLoading(false);
  }
  const [dateIsLoading, setDateIsLoading] = useState(false);

  return (
    <div>

      <Container style={{ width: '80%', marginTop: '5vh' }}>
        <Accordion fluid styled style={{ width: '100%', marginTop: '5vh' }}>
          <Accordion.Title
            active={activeIndex === 0}
            index={0}
            onClick={handleClick}
          >
            <Icon name='dropdown' />
          Crawler
        </Accordion.Title>
          <Accordion.Content active={activeIndex === 0}>
            <Form>
              <Form.Field>
                <label>Address to watch</label>
                <input placeholder='Address to watch' onChange={(e) => setAddressToWatch(e.target.value)} />
              </Form.Field>
              <Form.Field>
                <label>Starting Block</label>
                <input placeholder='Starting Block' onChange={(e) => setStartingBlockNumber(e.target.value)} />
              </Form.Field>
              <Button type='submit' onClick={handleSubmit} disabled={isLoading}>Submit</Button>
            </Form>
            {isLoading && <p>Searching in block {currentBlock} / {latestBlock}</p>}
            {canDisplay && !isLoading && TableExamplePagination}
          </Accordion.Content>
          <Accordion.Title
            active={activeIndex === 1}
            index={1}
            onClick={handleClick}
          >
            <Icon name='dropdown' />
          Value of ETH on Date
        </Accordion.Title>
          <Accordion.Content active={activeIndex === 1}>
            <Form>
              <Form.Field>
                <label>Address</label>
                <input placeholder='Address' onChange={(e) => setDateAddress(e.target.value)} />
              </Form.Field>
              <Form.Field>
                <label>Date</label>
                <input placeholder='Address to watch' type='date' onChange={(e) => setDate(e.target.value)} />
              </Form.Field>
              <Button type='submit' onClick={handleDateSubmit} disabled={dateIsLoading}>Submit</Button>
              {canDisplayDate && <p>Balance is {balanceAtDate}</p>}
            </Form>
          </Accordion.Content>
        </Accordion>

      </Container>
    </div>
  );
}

export default App;
