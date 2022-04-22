import { Address, log } from '@graphprotocol/graph-ts'
import { SpellToken, Transfer } from '../generated/SpellToken/SpellToken'
import { StakedSpellToken } from '../generated/SpellToken/StakedSpellToken'
import { RatioUpdate } from '../generated/schema'

export function handleTransfer(event: Transfer): void {
  // constants
  const STAKED_SPELL_ADDRESS = Address.fromString('0x26fa3fffb6efe8c1e69103acb4044c26b9a106a9')

  // verify this is a distrubition to sspell contract
  const toAddressString = event.params._to.toHexString()
  const stakedSpellAddressString = STAKED_SPELL_ADDRESS.toHexString()
  const isDistribution = toAddressString == stakedSpellAddressString
  if (!isDistribution) return

  // create new entity
  const id = event.transaction.hash.toHex()
  const ratioUpdate = new RatioUpdate(id)

  // contracts
  const spellContract = SpellToken.bind(event.address)
  const stakedSpellContract = StakedSpellToken.bind(STAKED_SPELL_ADDRESS)

  // calculations
  const totalContractSpell = spellContract.try_balanceOf(STAKED_SPELL_ADDRESS)
  const totalStakedSpell = stakedSpellContract.try_totalSupply()
  const ratio = totalContractSpell.toBigDecimal() / totalStakedSpell.toBigDecimal()

  // add entity properties
  ratioUpdate.block = event.block.number
  ratioUpdate.timestamp = event.block.timestamp
  ratioUpdate.spellAdded = event.params._value
  ratioUpdate.totalContractSpell = totalContractSpell
  ratioUpdate.totalStakedSpell = totalStakedSpell
  ratioUpdate.ratio = ratio

  // store entity
  ratioUpdate.save()
}
