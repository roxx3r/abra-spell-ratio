import { Address } from '@graphprotocol/graph-ts'
import { SpellToken, Transfer } from '../generated/SpellToken/SpellToken'
import { StakedSpellToken } from '../generated/SpellToken/StakedSpellToken'
import { RatioUpdate } from '../generated/schema'

export function handleTransfer(event: Transfer): void {
  // constants
  const STAKED_SPELL_ADDRESS = Address.fromString('0x26fa3fffb6efe8c1e69103acb4044c26b9a106a9')

  // verify this is a transfer to sspell contract
  const toAddressString = event.params._to.toHexString()
  const stakedSpellAddressString = STAKED_SPELL_ADDRESS.toHexString()
  const isToStakedSpellAddress = toAddressString == stakedSpellAddressString
  if (!isToStakedSpellAddress) return

  // contracts
  const spellContract = SpellToken.bind(event.address)
  const stakedSpellContract = StakedSpellToken.bind(STAKED_SPELL_ADDRESS)

  // contract calls
  const totalContractSpellCall = spellContract.try_balanceOf(STAKED_SPELL_ADDRESS)
  const totalStakedSpellCall = stakedSpellContract.try_totalSupply()
  if (totalContractSpellCall.reverted || totalStakedSpellCall.reverted) return

  // calculations
  const totalContractSpellDec = totalContractSpellCall.value.toBigDecimal()
  const totalStakedSpellDec = totalStakedSpellCall.value.toBigDecimal()
  const ratio = totalContractSpellDec / totalStakedSpellDec
  const ratioString = ratio.toString()
  const id = 'id_' + ratioString.substring(0, 10)

  // verify this ratio does not already exist
  let ratioUpdate = RatioUpdate.load(id)
  if (ratioUpdate) return

  // create new entity
  ratioUpdate = new RatioUpdate(id)
  ratioUpdate.tx = event.transaction.hash.toHex()
  ratioUpdate.block = event.block.number
  ratioUpdate.timestamp = event.block.timestamp
  ratioUpdate.spellAdded = event.params._value
  ratioUpdate.totalContractSpell = totalContractSpellCall.value
  ratioUpdate.totalStakedSpell = totalStakedSpellCall.value
  ratioUpdate.ratio = ratio

  // store entity
  ratioUpdate.save()
}
