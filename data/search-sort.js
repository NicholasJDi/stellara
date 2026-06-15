export function sortDataBySearchTags(data, searchScheme, inputText = "", includeWeight = false) {
	const tags = {};

	const regex = /(?:"([^"]+)"|([^\s:]+)):(?:"([^"]+)"|([^\s]+))/g;
	const matches = [...inputText.matchAll(regex)];

	for (const match of matches) {
		const key = match[1] || match[2];
		const value = match[3] || match[4];

		if (!(key in tags)) {
			tags[key] = [];
		}

		tags[key].push(value);
	}

	let cleanedText = inputText;

	for (let i = matches.length - 1; i >= 0; i--) {
		const match = matches[i];

		cleanedText =
			cleanedText.slice(0, match.index) +
			cleanedText.slice(match.index + match[0].length);
	}
	cleanedText = cleanedText.trim().replace(/\s+/g, " ");

	return sortDataBySearch(data, searchScheme, cleanedText, tags, includeWeight);
}

export function sortDataBySearch(data, searchScheme, inputText = "", inputTags = {}, includeWeight = false) {
	if (inputText === "" && Object.keys(inputTags).length === 0) {
		return data;
	} else {
		data = [...data].reverse();

		const outData = [];
		const index = new Array(data.length).fill(0);
		const tokens = inputText.toLowerCase().split(/\s+/).filter(Boolean);

		for (const key of Object.keys(searchScheme)) {
			const inputTokens =  [...tokens];
			for (const tag of (inputTags[key] || [])) {
				if (typeof tag === Array) {
					inputTokens.push(...tag);
				} else {
					inputTokens.push(...tag.toLowerCase().split(/\s+/).filter(Boolean));
				}
			}
			const searchItem = searchScheme[key];

			for (let i = 0; i < data.length; i++) {
				const item = data[i];

				if (key in item) {
					let value = item[key];

					if (Array.isArray(value)) {
						value = value.join(" ");
					}

					value = value.toLowerCase().split(/\s+/).filter(Boolean);

					let success = false;
					const weight = Number(searchItem.weight ?? 1);
					const tokenWeight = Number(searchItem.token_weight ?? 0);
					const positionWeight = Number(searchItem.position_weight ?? 0);
					let totalWeight = 0;

					switch (searchItem.type) {
						case "contains":
							for (const token of inputTokens) {
								for (const searchToken of value) {
									if (searchToken.includes(token)) {
										success = true;
										totalWeight += tokenWeight;
										if (tokens.includes(token)){
											totalWeight += positionWeight * (tokens.length - tokens.indexOf(token));
										}
									} else if (token.includes(searchToken)) {
										success = true;
										const ratio = searchToken.length / token.length;
										totalWeight += tokenWeight * ratio;
										if (tokens.includes(token)){
											totalWeight += (positionWeight * (tokens.length - tokens.indexOf(token))) * ratio;
										}
									}
								}
							}
							break;

						case "exact":
							for (const token of inputTokens) {
								if (value.includes(token)) {
									success = true;
									totalWeight += tokenWeight;
									if (tokens.includes(token)){
										totalWeight += positionWeight * (tokens.length - tokens.indexOf(token));
									}
								}
							}
							break;

						case "range":
							for (const token of inputTokens) {
								const parts = token.split("|");
								if (parts.length === 2) {
									let [start, end] = parts;
									if (start > end) {
										[start, end] = [end, start];
									}
									for (const searchToken of value) {
										if (start <= searchToken && searchToken <= end) {
											success = true;
											totalWeight += tokenWeight;
											if (tokens.includes(token)){
												totalWeight += positionWeight * (tokens.length - tokens.indexOf(token));
											}
										}
									}
								}
							}
							break;
					}

					if (success) {
						totalWeight += weight;
					}

					index[i] += totalWeight;
				}
			}
		}

		const sortArray = [];
		for (let i = 0; i < index.length; i++) {
			if (index[i] !== 0) {
				sortArray.push([index[i], i]);
			}
		}

		sortArray.sort((a, b) => b[0] - a[0]);

		for (const [weightValue, dataIndex] of sortArray) {
			const out = includeWeight
				? { ...data[dataIndex], weight: weightValue }
				: data[dataIndex];

			outData.push(out);
		}

		return outData;
	}
}

export function sortDataBySchemeMode(data, sortScheme, sortMode = "default") {
	let mode = sortScheme[sortMode];

	while (typeof mode === "string") {
		if (mode in sortScheme) {
			mode = sortScheme[mode];
		} else {
			break;
		}
	}

	return sortData(data, mode);
}

export function sortData(data, sortMode) {
	let groups = [data];

	for (const ruleKey of Object.keys(sortMode)) {
		const rule = sortMode[ruleKey];
		const newGroups = [];
		const groupMap = {};
		let groupIndex = 0;

		for (const group of groups) {
			switch (rule.type) {

				case "sort": {
					const g = [...group];

					g.sort((a, b) => {
						const aVal = a[ruleKey];
						const bVal = b[ruleKey];

						if (rule.reverse) {
							return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
						} else {
							return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
						}
					});

					newGroups.push(g);
					break;
				}

				case "order": {
					const buckets = {};
					const order = [...rule.order];

					if (rule.reverse) {
						order.reverse();
					}

					for (const bucket of order) {
						buckets[bucket] = [];
					}

					buckets[null] = [];

					for (const item of group) {
						const key = item[ruleKey];
						if (key in buckets) {
							buckets[key].push(item);
						} else {
							buckets[null].push(item);
						}
					}

					for (const bucketKey of Object.keys(buckets)) {
						if (buckets[bucketKey].length > 0) {
							newGroups.push(buckets[bucketKey]);
						}
					}
					break;
				}

				case "group": {
					let ungrouped = [];

					for (const item of group) {
						const value = item[ruleKey];

						if (value != null) {
							if (ungrouped.length > 0) {
								newGroups.push([...ungrouped]);
								groupIndex++;
								ungrouped = [];
							}

							if (value in groupMap) {
								newGroups[groupMap[value]].push(item);
							} else {
								groupMap[value] = groupIndex;
								newGroups.push([item]);
								groupIndex++;
							}
						} else {
							ungrouped.push(item);
						}
					}

					if (ungrouped.length > 0) {
						newGroups.push([...ungrouped]);
						groupIndex++;
					}
					break;
				}
			}
		}

		if (rule.type === "group" && rule.reverse) {
			for (const key of Object.keys(groupMap)) {
				newGroups[groupMap[key]].reverse();
			}
		}

		if (rule.reverse_after) {
			newGroups.reverse();
		}

		groups = newGroups;
	}

	return groups.flat();
}