<script lang="ts">
	import { BinInputParser, HexInputParser } from './instructions/parser/input-parser';
	import type { ParseInfo } from './instructions/parser/parse-info';
	import { binToHex, hexToBin, binToDec } from './utils';
	import type { Settings } from './instructions/settings';
	import { HexFormat, DecFormat, BinFormat } from './instructions/format/immediate-format';
	import { MipsDecoder, MipsEncoder } from './instructions/parser/mips-parser';
	import type { Instruction } from './instructions';
	import type { FieldRole } from './instructions/field-role';
	const immediateFormats = [new HexFormat(), new DecFormat(), new BinFormat()];	

	// Inputs
	let hexInput: string;
	let binInput: string;
	let instructionInput: string;

	// Input errors
	let encodedParseInfo: ParseInfo | null = null;
	let mipsParseInfo: ParseInfo | null = null;

	// Settings
	let settings: Settings = {
		encodedInputMode: 'hex',
		inputMode: 'encoded',
		registerMode: 'names',
		immediateFormat: immediateFormats[0],
	};

	function toggleInput(): void {
		settings.encodedInputMode = settings.encodedInputMode === 'hex' ? 'binary' : 'hex';
	}

	function toggleInputType(): void {
		settings.inputMode = settings.inputMode === 'encoded' ? 'mips' : 'encoded';
	}

	function getFieldRoleColor(fieldRole: FieldRole): string {
		switch (fieldRole) {
			case 'destination':
				return '#B0FFBA';
			case 'source':
				return '#FFD694'
			case 'source1':
				return '#FF8585';
			case 'source2':
				return '#F592F5';
			case 'immediate':
			case 'shift amount':
			case 'jump address':
				return '#918AFF';
			case 'instruction':
				return 'white';
			case 'unknown':
			case 'unused':
				return 'gray';
		}
	}

	let binary: string;

	$: {
		if (settings.inputMode === 'encoded') {
			if (settings.encodedInputMode === 'hex') {
				const parser = new HexInputParser(hexInput ?? '');

				// Update binary
				binary = hexToBin(parser.get());

				// Update other input
				binInput = binary;
				encodedParseInfo = parser.getParseInfo();
			} else {
				const parser = new BinInputParser(binInput ?? '');

				// Update binary
				binary = parser.get();

				// Update other input
				hexInput = binToHex(binary);
				encodedParseInfo = parser.getParseInfo();
			}
		} else {
			// Input type is mips
			const encoder = new MipsEncoder(instructionInput?.trim() ?? '');
			mipsParseInfo = encoder.getParseInfo();
			binary = encoder.get() ?? '';
		}
	}

	$: fullBinary = binary.padEnd(32, '0');
	$: fullHexadecimal = parseInt(fullBinary, 2).toString(16).padStart(8, '0');
	$: hexDisplay = binToHex(binary);


	let instruction: Instruction;
	$: instruction = new MipsDecoder(binary, settings).get();
	$: fields = instruction?.fields ?? [];
	$: mipsInstruction = instruction?.toMips() ?? null;
</script>

<main>
	<h1>mips converter</h1>
	<section class="raised">
			<form autocomplete="off" on:submit={(e) => e.preventDefault()}>
				<div class="split">
					<h2 class="remove-margin-top">Instruction</h2>
					<div>
						<span id="mips-instruction" class="input inset full-width">
							{#if !mipsInstruction}
								unknown
							{/if}
							{#if mipsInstruction}
								{#each mipsInstruction as mipsPart}
									<span
										style={`color: ${getFieldRoleColor(mipsPart.fieldRole ?? 'unknown')}`}
										title={mipsPart.fieldRole ?? undefined}
									>
										<pre>{mipsPart.value}</pre>
									</span>
								{/each}
							{/if}
						</span>
					</div>
						<div id="settings" class="right">
							{#if settings.inputMode === 'encoded'}
							<div class="setting">
								<button id="change-input-button" class="icon-button" on:click={toggleInput}>
									<label for="change-input-button">as {settings.encodedInputMode}</label>
									<span class="material-icons">
										sync
									</span>
								</button>
							</div>
							{/if}
							<div class="setting">
							<button id="change-input-type-button" class="icon-button" on:click={toggleInputType}>
								<label for="change-input-type-button">using {settings.inputMode}</label>
								<span class="material-icons">
									sync
								</span>
							</button>
						</div>
					</div>
				</div>
				<div class="split">
					<fieldset disabled={settings.inputMode === 'mips'}>
						<h3 class="remove-margin-top">encoded instruction</h3>
						{#if settings.encodedInputMode === 'hex'}
						<div class="input full-width">
							<input
								id="hexInput"
								class="code"
								bind:value={hexInput}
								placeholder="0x12345678"
							/>
						</div>
						{/if}
						{#if settings.encodedInputMode === 'binary'}
						<div class="input full-width">
							<input
								id="binInput"
								class="code"
								bind:value={binInput}
								placeholder="01011001..."
							/>
						</div>
						{/if}
						
						{#if encodedParseInfo !== null}
							<p class="error">{encodedParseInfo.value}</p>
						{/if}
					</fieldset>
					<fieldset disabled={settings.inputMode === 'encoded'}>
						<h3 class="remove-margin-top">mips instruction</h3>
						<div class="input full-width">
							<input
								id="mipsInput"
								class="code"
								bind:value={instructionInput}
								placeholder="add ..."
							/>
						</div>
						{#if mipsParseInfo !== null}
							<p class="error">{mipsParseInfo.value}</p>
						{/if}
					</fieldset>
				</div>
			</form>
			<div class="inset">
				<h3 class="remove-margin-top">Instruction Bytes</h3>
			<table class="code-table raw-table transparent">
				<tr>
					<!-- <th class="vertical-th"></th> -->
					
					{#each [32, 28, 24, 20, 16, 12, 8, 4, 0] as index}
						<td style="text-align: right">{index}</td>
					{/each}
				</tr>
			</table>
			<table class="code-table raw-table">
				<tbody>
					<tr>
						<th class="vertical-th">Binary</th>
						{#each (fullBinary.match(/.{1,4}/g) ?? []) as chunk, i}
							<td>
								{#if i * 4 >= binary.length}
									<span class="gray">{chunk}</span>
								{/if}
								{#if i * 4 + 4 <= binary.length}
									<span>{chunk}</span>
								{/if}
								{#if i * 4 < binary.length && i * 4 + 4 > binary.length}
									<span>{chunk.substring(0, binary.length - i * 4)}</span><!--
									--><span class="gray">{'0'.repeat(4 - (binary.length - i * 4))}</span>
								{/if}
							</td>
						{/each}
					</tr>
					<tr>
						<th class="vertical-th">Hex</th>
						{#each fullHexadecimal.split('') as chunk, i}
							<td class={i >= hexDisplay.length ? 'gray' : ''}>{chunk}</td>
						{/each}
					</tr>
				</tbody>
			</table>
		</div>
		<div class="inset">
			<h3 class="remove-margin-top">Instruction Fields</h3>
		<table id="fields" class="code-table">
			<thead>
				<tr>
					{#each fields as field, i}
						<th>
							<span style={`color: ${getFieldRoleColor(instruction.fieldRoles[i])}`}>{field.name}</span>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				<tr>
					{#each fields as field, i}
						<td>
							<span
								style={`color: ${getFieldRoleColor(instruction.fieldRoles[i])}`}
								title={instruction.fieldRoles[i]}
							>
								{field.value}
							</span>
						</td>
					{/each}
				</tr>
				<tr>
					{#each fields as field, i}
						<td style="width: {field.length / 32}%">
							<span
								style={`color: ${getFieldRoleColor(instruction.fieldRoles[i])}`}
							>
								0x{binToHex(field.binary)}<!--
														--><span class="gray">{'0'.repeat(field.length - field.binary.length)}</span>
							</span>
						</td>
					{/each}
				</tr>
				<tr>
					{#each fields as field, i}
						<td style="width: {field.length / 32}%">
							<span
								style={`color: ${getFieldRoleColor(instruction.fieldRoles[i])}`}
							>
								<span>{binToDec(field.binary)}</span><!--
														--><span class="gray">{'0'.repeat(field.length - field.binary.length)}</span>
							</span>
						</td>
					{/each}
				</tr>
				<tr>
					{#each fields as field, i}
						<td style="width: {field.length / 32}%">
							<span
								style={`color: ${getFieldRoleColor(instruction.fieldRoles[i])}`}
							>
								<span>{field.binary}</span><!--
														--><span class="gray">{'0'.repeat(field.length - field.binary.length)}</span>
							</span>
						</td>
					{/each}
				</tr>
			</tbody>
		</table>
		
	</div>
	</section>
	<section class="raised">
		<h2 style="margin-block-start: 0;">Single-Cycle Values</h2>

		<h3>Control Unit</h3>
		<h3>Register File</h3>
		<h3>Data Memory</h3>
	</section>
</main>

<style>
	main {
		text-align: left;
		padding: 1em;
		max-width: 50rem;
		margin: 0 auto;
		--table-border-width: 0.1rem;
	}

	.split {
		display: flex;
	}

	.split > * {
		flex: 1;
	}

	.split > *:not(:first-child) {
		margin-inline-start: 1rem;
	}

	.code {
		font-family: 'Inconsolata', monospace;
		font-weight: bold;
	}

	.gray {
		opacity: 50%;
	}

	.remove-margin-top {
		margin-block-start: 0;
	}

	.remove-margin-bottom {
		margin-block-end: 0;
	}

	.raised {
		box-shadow:  8px 8px 36px #232c3b,
             -8px -8px 36px #37445d;
		border-radius: 1rem;
		margin-inline: -1rem;
		margin-block-end: 2rem;
		padding-inline: 1rem;
		padding-block: 1.5rem;
	}

	table.transparent,
	table.transparent td {
		border-color: transparent;
	}

	.raw-table {
		table-layout: fixed;
	}

	table:not(#fields) {
		border-collapse: collapse;
	}

	table:not(#fields):not(.transparent) td {
		border-collapse: collapse;
		border: var(--table-border-width) solid var(--clr-divider);
	}

	table#fields th,
	table#fields td {
		border-top: var(--table-border-width) solid var(--clr-divider);
		border-right: var(--table-border-width) solid var(--clr-divider);
	}

	table#fields {
		border-spacing: 0;
		/* border-left: var(--table-border-width) solid var(--clr-on);
		border-bottom: var(--table-border-width) solid var(--clr-on); */
		/* border-collapse: collapse; */
	}

	table { 
		width: 100%;
		text-align: center;
	}

	table#fields.inset th {
		border-top: none;
	}

	table#fields.inset th:last-child,
	table#fields.inset td:last-child {
		border-right: none;
	}

	.code-table td {
		font-family: 'Inconsolata', monospace;
		font-weight: bold;
	}

	table .vertical-th {
		text-align: end;
		margin-right: 2rem;
		border-inline-start-color: transparent;
		border-block-color: transparent;
	}

	table .vertical-th:after {
		content: '   ';
		white-space: pre;
	}

	.icon-button {
		display: flex;
		align-items: end;
		padding-inline: 0.5rem;
		padding-block: 0.5rem;
		vertical-align: middle;
		text-align: center;
	}

	.icon-button:disabled {
		border-color: var(--clr-disabled);
		color: var(--clr-disabled);
	}

	.icon-button label {
		margin-inline: 0.3rem;
	}

	.input.full-width input {
		width: 100%;
	}

	.setting label {
		font-size: 1rem;
		font-weight: bold;
		margin-block-end: 0.5rem;
	}

	#change-input-button {
		margin: 0;
	}

	.right {
		justify-content: flex-end;
	}

	#settings {
		display: flex;
	}

	#settings > .setting {
		margin-inline-end: 1.5rem;
		width: max-content;
	}

	#mips-instruction {
		font-size: 1.5rem;
		color: var(--clr-on-background);
		display: inline-flex;
		padding-inline: 1rem;
		padding-block: 0.5rem;
		margin-block-start: 0;
	}

	.inset {
		box-shadow: inset 5px 5px 7px #273142,
            inset -5px -5px 7px #333f56;
		border-radius: 0.5rem;
		display: inline-block;
		padding-inline: 1em;
		padding-block: 0.5em;
		margin-block-end: 0.5em;
	}

	@media (max-width: 640px) {
		main {
			max-width: none;
		}

		.split {
			display: block;
		}

		.split > *:not(:first-child) {
			margin-inline-start: 0rem;
		}

		
		#settings {
			display: block;
		}

		#settings > .setting {
			margin-inline-end: 0;
		}
	}
</style>