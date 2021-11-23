import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from './utils'
import './global.css'
import Big from 'big.js';
import { v4 as uuidv4 } from 'uuid';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();


import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

export default function App() {
  // use React Hooks to store nft owned
  const [tokens, set_tokens] = React.useState()

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(false)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        // window.contract is set by initContract in index.js
        // get owned NFTs
        window.contract.nft_tokens_for_owner({ account_id: window.accountId })
          .then(ownedTokens => {
            set_tokens(ownedTokens)
          })
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to HappyBits NFT!</h1>
        <p>
          Go ahead and click the button below to try it out:
        </p>
        <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>
        <form onSubmit={async event => {
          event.preventDefault()

          // get elements from the form using their id attribute
          const { fieldset } = event.target.elements

          // disable the form while the value gets updated on-chain
          fieldset.disabled = true

          try {
            // make an update call to the smart contract
            await window.contract.nft_mint({
              token_id: uuidv4(),
              token_owner_id: window.accountId,
              token_metadata: {
                title: "Olympus Mons",
                description: "The tallest mountain in the charted solar system",
                copies: 1
              }
            },
            BOATLOAD_OF_GAS,
            Big(1).times(10 ** 24).toFixed() 
            )
          } catch (e) {
            alert(
              'Something went wrong! ' +
              'Maybe you need to sign out and back in? ' +
              'Check your browser console for more info.'
            )
            throw e
          } finally {
            // re-enable the form, whether the call succeeded or failed
            fieldset.disabled = false
            // update owned tokens
            window.contract.nft_tokens_for_owner({ account_id: window.accountId })
            .then(ownedTokens => {
              set_tokens(ownedTokens)
            })
          }


        }}>
          <fieldset id="fieldset">
            <div style={{ display: 'flex' }}>
              <button
                disabled={buttonDisabled}
                style={{ borderRadius: '0 5px 5px 0' }}
              >
                1 NEAR to Mint
              </button>
            </div>
            <div>
              <br/>
              Your NFTS: <br/>
              <TokenList tokens={tokens} />
            </div>
          </fieldset>
        </form>
      </main>
      {showNotification && <Notification />}
    </>
  )
}

function TokenList(props) {
  const tokens = props.tokens;
  if(tokens != null) {
  const listItems = tokens.map((token) => <li key={token.token_id}>{token.token_id}</li>  );  
  return (<ul>{listItems}</ul>  );
  } else {
    return (<ul/>)
  }

}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'nft_mint' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
