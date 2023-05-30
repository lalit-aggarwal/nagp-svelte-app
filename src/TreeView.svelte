<script>
  //	import { slide } from 'svelte/transition'
  import { expansionState } from "./store/store";
  export let tree, selectedLbl;
  const { label, children } = tree;

  $: expanded = $expansionState[label] || false;

  /* Function to Toggle Folder Expansion state */
  const toggleExpansion = () => {
    let value = !expanded;
    expanded = value;
    expansionState.update((state) => {
      const updatedState = { ...state };
      updatedState[label] = value;
      return updatedState;
    });
  };
  $: arrowDown = expanded;
</script>

<ul>
  <!-- transition:slide -->
  <li>
    {#if children}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <span on:click={toggleExpansion} title={`Folder : ${label}`}>
        <span class="arrow" class:arrowDown>&#x25b6</span>
        <span
          on:click={() => (selectedLbl = label)}
          class={`${selectedLbl === label ? "selected" : ""}`}>{label}</span
        >
      </span>
      {#if expanded}
        {#each children as child}
          <svelte:self tree={child} bind:selectedLbl />
        {/each}
      {/if}
    {:else}
      <span title={`File : ${label}`}>
        <span class="no-arrow" />
        {label}
      </span>
    {/if}
  </li>
</ul>

<style>
  ul {
    margin: 0 1rem;
    list-style: none;
    padding-left: 1.2rem;
    user-select: none;
  }
  .no-arrow {
    padding-left: 1rem;
  }
  .arrow {
    cursor: pointer;
    display: inline-block;
    /* transition: transform 200ms; */
  }
  .arrowDown {
    transform: rotate(90deg);
  }
  .selected {
    background-color: aqua;
  }
</style>
